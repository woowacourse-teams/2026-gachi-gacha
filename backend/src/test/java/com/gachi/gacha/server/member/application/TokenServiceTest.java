package com.gachi.gacha.server.member.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.gachi.gacha.server.common.auth.jwt.JwtProperty;
import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.application.dto.TokenInfo;
import com.gachi.gacha.server.member.domain.auth.token.RefreshToken;
import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenGenerator;
import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenHasher;
import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenJpaRepository;
import com.gachi.gacha.server.member.domain.exception.ExpiredRefreshTokenException;
import com.gachi.gacha.server.member.domain.exception.InvalidRefreshTokenException;
import com.gachi.gacha.server.member.domain.exception.ReusedRefreshTokenException;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock
    RefreshTokenJpaRepository repository;

    RefreshTokenHasher hasher = new RefreshTokenHasher();
    TokenService tokenService;

    @BeforeEach
    void setUp() {
        JwtProperty property = new JwtProperty("test-secret-key-test-secret-key-1234", 30L, 14L);
        tokenService = new TokenService(
                new JwtProvider(property), property,
                new RefreshTokenGenerator(), hasher, repository
        );
    }

    private RefreshToken tokenOf(String raw, String familyId, LocalDateTime expiresAt) {
        return RefreshToken.builder()
                .memberId(1L)
                .tokenHash(hasher.hash(raw))
                .familyId(familyId)
                .expiresAt(expiresAt)
                .build();
    }

    @Test
    void 로그인_시_토큰은_해시로만_저장된다() {
        TokenInfo info = tokenService.issue(1L);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getTokenHash()).isEqualTo(hasher.hash(info.refreshToken()));
        assertThat(captor.getValue().getTokenHash()).isNotEqualTo(info.refreshToken());
    }

    @Test
    void 정상_재발급_시_기존_토큰은_폐기되고_같은_family로_새_토큰이_저장된다() {
        RefreshToken current = tokenOf("raw", "family-1", LocalDateTime.now().plusDays(1));
        given(repository.findByTokenHashForUpdate(hasher.hash("raw"))).willReturn(Optional.of(current));

        TokenInfo result = tokenService.reissue("raw");

        assertThat(current.isRevoked()).isTrue();
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getFamilyId()).isEqualTo("family-1");
        assertThat(result.refreshToken()).isNotEqualTo("raw");
    }

    @Test
    void 폐기된_토큰_재사용_시_family_전체를_폐기하고_예외를_던진다() {
        RefreshToken current = tokenOf("raw", "family-1", LocalDateTime.now().plusDays(1));
        current.revoke(LocalDateTime.now());
        given(repository.findByTokenHashForUpdate(anyString())).willReturn(Optional.of(current));

        assertThatThrownBy(() -> tokenService.reissue("raw"))
                .isInstanceOf(ReusedRefreshTokenException.class);
        verify(repository).revokeAllByFamilyId(anyString(), any(LocalDateTime.class));
        verify(repository, never()).save(any());
    }

    @Test
    void 만료된_토큰은_예외를_던지고_새_토큰을_저장하지_않는다() {
        RefreshToken current = tokenOf("raw", "family-1", LocalDateTime.now().minusMinutes(1));
        given(repository.findByTokenHashForUpdate(anyString())).willReturn(Optional.of(current));

        assertThatThrownBy(() -> tokenService.reissue("raw"))
                .isInstanceOf(ExpiredRefreshTokenException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void 존재하지_않는_토큰은_INVALID_예외() {
        given(repository.findByTokenHashForUpdate(anyString())).willReturn(Optional.empty());

        assertThatThrownBy(() -> tokenService.reissue("unknown"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void null_또는_빈_토큰은_INVALID_예외() {
        assertThatThrownBy(() -> tokenService.reissue(null))
                .isInstanceOf(InvalidRefreshTokenException.class);
        assertThatThrownBy(() -> tokenService.reissue("  "))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void 로그아웃은_family_전체를_폐기한다() {
        RefreshToken current = tokenOf("raw", "family-1", LocalDateTime.now().plusDays(1));
        given(repository.findByTokenHashForUpdate(hasher.hash("raw"))).willReturn(Optional.of(current));

        tokenService.logout("raw");

        verify(repository).revokeAllByFamilyId(eq("family-1"), any(LocalDateTime.class));
    }

    @Test
    void 존재하지_않는_토큰으로_로그아웃해도_예외가_없다() {
        given(repository.findByTokenHashForUpdate(anyString())).willReturn(Optional.empty());

        assertThatCode(() -> tokenService.logout("unknown")).doesNotThrowAnyException();
        verify(repository, never()).revokeAllByFamilyId(anyString(), any());
    }

    @Test
    void null_또는_빈_토큰으로_로그아웃하면_저장소를_호출하지_않는다() {
        tokenService.logout(null);
        tokenService.logout("  ");

        verifyNoInteractions(repository);
    }
}
