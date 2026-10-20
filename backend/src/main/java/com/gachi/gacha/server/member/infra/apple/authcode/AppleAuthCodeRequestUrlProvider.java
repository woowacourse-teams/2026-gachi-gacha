package com.gachi.gacha.server.member.infra.apple.authcode;

import com.gachi.gacha.server.member.domain.auth.authcode.AuthCodeRequestUrlProvider;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.infra.apple.AppleOauthConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class AppleAuthCodeRequestUrlProvider implements AuthCodeRequestUrlProvider {

    private final AppleOauthConfig config;

    @Override
    public OauthProviderType supportProvider() {
        return OauthProviderType.APPLE;
    }

    @Override
    public String provide(final String nonce) {
        return UriComponentsBuilder
                .fromUriString("https://appleid.apple.com/auth/authorize")
                .queryParam("response_type", "code")
                .queryParam("response_mode", "form_post")   // name/email scope 사용 시 필수
                .queryParam("client_id", config.clientId())
                .queryParam("redirect_uri", config.redirectUri())
                .queryParam("scope", String.join(" ", config.scope())) // 공백 구분
                .queryParam("state", nonce)
                .queryParam("nonce", nonce)
                .encode()
                .build()
                .toUriString();
    }
}
