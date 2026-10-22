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
        return build(nonce, config.redirectUri());
    }

    public String provideForWithdraw(final String nonce) {
        return build(nonce, config.withdrawRedirectUri());
    }

    private String build(final String nonce, final String redirectUri) {
        return UriComponentsBuilder
                .fromUriString("https://appleid.apple.com/auth/authorize")
                .queryParam("response_type", "code")
                .queryParam("response_mode", "form_post")
                .queryParam("client_id", config.clientId())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("scope", String.join(" ", config.scope()))
                .queryParam("state", nonce)
                .queryParam("nonce", nonce)
                .encode()
                .build()
                .toUriString();
    }
}
