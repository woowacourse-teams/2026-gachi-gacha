package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.auth.authcode.AuthCodeRequestUrlProviderComposite;
import com.gachi.gacha.server.member.domain.auth.client.OauthMemberClientComposite;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;
import com.gachi.gacha.server.member.domain.exception.MemberNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OauthService {

    private final AuthCodeRequestUrlProviderComposite authCodeRequestUrlProviderComposite;
    private final OauthMemberClientComposite oauthMemberClientComposite;
    private final MemberJpaRepository memberJpaRepository;

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

    private Member saveOrFind(final Member fetched) {
        try {
            return memberJpaRepository.saveAndFlush(fetched);
        } catch (DataIntegrityViolationException e) {
            return memberJpaRepository.findByOauthId(fetched.getOauthId())
                    .orElseThrow(() -> e);
        }
    }

    public void revokeIfNeeded(final Long memberId, final String authCode, final String nonce) {
        Member member = memberJpaRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(ErrorCode.MEMBER_NOT_FOUND));
        OauthId oauthId = member.getOauthId();

        if (oauthId.getOauthProvider() == OauthProviderType.APPLE) {
            if (authCode == null || nonce == null) {
                throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
            }
            oauthMemberClientComposite.revokeByAuthCode(
                    OauthProviderType.APPLE, authCode, nonce, oauthId.getOauthId());
        }
    }
}
