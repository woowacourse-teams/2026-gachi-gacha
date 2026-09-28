package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.common.auth.jwt.JwtProperty;
import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.dto.TokenInfo;
import com.gachi.gacha.server.member.domain.auth.token.RefreshToken;
import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenGenerator;
import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenHasher;
import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenJpaRepository;
import com.gachi.gacha.server.member.domain.exception.ExpiredRefreshTokenException;
import com.gachi.gacha.server.member.domain.exception.InvalidRefreshTokenException;
import com.gachi.gacha.server.member.domain.exception.ReusedRefreshTokenException;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtProvider jwtProvider;
    private final JwtProperty jwtProperty;
    private final RefreshTokenGenerator refreshTokenGenerator;
    private final RefreshTokenHasher refreshTokenHasher;
    private final RefreshTokenJpaRepository refreshTokenJpaRepository;

    /** 로그인 성공 시: 새 family(=새 세션)를 만들어 토큰 쌍을 발급 */
    @Transactional
    public TokenInfo issue(final Long memberId) {
        String familyId = UUID.randomUUID().toString();
        return createTokenPair(memberId, familyId, LocalDateTime.now());
    }

    /** 재발급: rotation + 재사용 감지 */
    @Transactional(noRollbackFor = ReusedRefreshTokenException.class)
    public TokenInfo reissue(final String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        LocalDateTime now = LocalDateTime.now();
        String tokenHash = refreshTokenHasher.hash(rawRefreshToken);

        RefreshToken current = refreshTokenJpaRepository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new InvalidRefreshTokenException(ErrorCode.INVALID_REFRESH_TOKEN));

        if (current.isRevoked()) {
            log.warn("refresh token 재사용 감지: memberId={}, familyId={}",
                    current.getMemberId(), current.getFamilyId());
            refreshTokenJpaRepository.revokeAllByFamilyId(current.getFamilyId(), now);
            throw new ReusedRefreshTokenException(ErrorCode.REUSED_REFRESH_TOKEN);
        }
        if (current.isExpired(now)) {
            throw new ExpiredRefreshTokenException(ErrorCode.EXPIRED_REFRESH_TOKEN);
        }

        current.revoke(now);
        return createTokenPair(current.getMemberId(), current.getFamilyId(), now);
    }

    /** 로그아웃: 해당 기기(family)의 세션만 종료. 멱등하게 동작 */
    @Transactional
    public void logout(final String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = refreshTokenHasher.hash(rawRefreshToken);
        refreshTokenJpaRepository.findByTokenHashForUpdate(tokenHash)
                .ifPresent(token -> refreshTokenJpaRepository
                        .revokeAllByFamilyId(token.getFamilyId(), LocalDateTime.now()));
    }

    /** 전체 기기 로그아웃 / 회원 탈퇴 시 호출 */
    @Transactional
    public void revokeAll(final Long memberId) {
        refreshTokenJpaRepository.revokeAllByMemberId(memberId, LocalDateTime.now());
    }

    private TokenInfo createTokenPair(final Long memberId, final String familyId, final LocalDateTime now) {
        String rawRefreshToken = refreshTokenGenerator.generate();

        refreshTokenJpaRepository.save(RefreshToken.builder()
                .memberId(memberId)
                .tokenHash(refreshTokenHasher.hash(rawRefreshToken))
                .familyId(familyId)
                .expiresAt(now.plusDays(jwtProperty.refreshTokenExpirationDay()))
                .build());

        return new TokenInfo(jwtProvider.createToken(memberId), rawRefreshToken);
    }
}
