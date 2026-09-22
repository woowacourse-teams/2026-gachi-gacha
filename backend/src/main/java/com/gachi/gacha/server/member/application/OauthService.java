package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.auth.authcode.AuthCodeRequestUrlProviderComposite;
import com.gachi.gacha.server.member.domain.auth.client.OauthMemberClientComposite;
import lombok.RequiredArgsConstructor;
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

    public LoginInfo login(final OauthProviderType provider, final String code, final String nonce) {
        Member member = oauthMemberClientComposite.fetch(provider, code, nonce);
        return LoginInfo.from(
                memberJpaRepository.findByOauthId(member.getOauthId())
                        .orElseGet(() -> memberJpaRepository.save(member))
        );
    }
}
