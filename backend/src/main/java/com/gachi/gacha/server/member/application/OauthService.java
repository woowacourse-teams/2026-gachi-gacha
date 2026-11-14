package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.application.dto.MobileNonceInfo;
import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.nonce.MobileOauthNonce;
import com.gachi.gacha.server.member.domain.auth.nonce.MobileOauthNonceHasher;
import com.gachi.gacha.server.member.domain.auth.nonce.MobileOauthNonceJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.auth.authcode.AuthCodeRequestUrlProviderComposite;
import com.gachi.gacha.server.member.domain.auth.client.OauthMemberClientComposite;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;
import com.gachi.gacha.server.member.domain.exception.MemberNotFoundException;
import com.gachi.gacha.server.member.domain.exception.UnSupportedProviderTypeException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OauthService {

    private final AuthCodeRequestUrlProviderComposite authCodeRequestUrlProviderComposite;
    private final OauthMemberClientComposite oauthMemberClientComposite;
    private final MemberJpaRepository memberJpaRepository;
    private final MemberService memberService;
    private final MobileOauthNonceJpaRepository mobileOauthNonceJpaRepository;
    private final MobileOauthNonceHasher mobileOauthNonceHasher;

    @Value("${oauth.mobile-nonce-ttl-seconds:300}")
    private long mobileNonceTtlSeconds;

    @Transactional
    public MobileNonceInfo issueMobileNonce(final OauthProviderType provider) {
        String nonce = UUID.randomUUID().toString();
        mobileOauthNonceJpaRepository.save(MobileOauthNonce.builder()
                .nonceHash(mobileOauthNonceHasher.hash(nonce))
                .provider(provider)
                .expiresAt(LocalDateTime.now().plusSeconds(mobileNonceTtlSeconds))
                .build());
        return new MobileNonceInfo(nonce, mobileNonceTtlSeconds);
    }

    @Transactional
    public void consumeMobileNonce(final OauthProviderType provider, final String nonce) {
        int deleted = mobileOauthNonceJpaRepository.consume(
                mobileOauthNonceHasher.hash(nonce), provider, LocalDateTime.now());
        if (deleted != 1) {
            throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
        }
    }

    public String getAuthCodeRequestUrl(final OauthProviderType provider, final String nonce) {
        return authCodeRequestUrlProviderComposite.provide(provider, nonce);
    }

    public String getWithdrawAuthCodeRequestUrl(final Long memberId, final String nonce) {
        Member member = memberJpaRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(ErrorCode.MEMBER_NOT_FOUND));
        return authCodeRequestUrlProviderComposite.provideForWithdraw(
                member.getOauthId().getOauthProvider(), nonce);
    }

    public LoginInfo login(final OauthProviderType provider, final String code, final String nonce, final String name) {
        Member fetched = oauthMemberClientComposite.fetch(provider, code, nonce, name);

        Member member = memberJpaRepository.findByOauthId(fetched.getOauthId())
                .orElseGet(() -> saveOrFind(fetched));
        return LoginInfo.from(member);
    }

    public LoginInfo loginWithMobileCode(final OauthProviderType provider, final String code, final String nonce,
                                         final String codeVerifier, final String name) {
        Member fetched = oauthMemberClientComposite.fetchMobile(provider, code, nonce, codeVerifier, name);
        Member member = memberJpaRepository.findByOauthId(fetched.getOauthId())
                .orElseGet(() -> saveOrFind(fetched));
        return LoginInfo.from(member);
    }

    private Member saveOrFind(final Member fetched) {
        try {
            return memberJpaRepository.saveAndFlush(fetched);
        } catch (DataIntegrityViolationException e) {
            return memberJpaRepository.findByOauthId(fetched.getOauthId())
                    .orElseThrow(() -> e);
        }
    }

    public MemberDeleteResult withdrawWithoutReauth(final Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        if (member.getOauthId().getOauthProvider() == OauthProviderType.APPLE) {
            throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
        }
        return memberService.removeMember(memberId);
    }

    public void withdraw(final Long memberId, final String authCode, final String nonce) {
        Member member = memberJpaRepository.getMemberById(memberId);
        OauthId oauthId = member.getOauthId();
        if (oauthId.getOauthProvider() != OauthProviderType.APPLE) {
            throw new UnSupportedProviderTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR);
        }
        if (authCode == null || nonce == null) {
            throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
        }
        oauthMemberClientComposite.revokeByAuthCode(
                OauthProviderType.APPLE, authCode, nonce, oauthId.getOauthId());
        memberService.removeMember(memberId);
    }
}
