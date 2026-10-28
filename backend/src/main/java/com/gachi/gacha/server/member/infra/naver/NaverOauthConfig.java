package com.gachi.gacha.server.member.infra.naver;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("oauth.naver")
public record NaverOauthConfig (
        String redirectUri,
        String mobileRedirectUri,
        String clientId,
        String mobileClientId,
        String clientSecret,
        String mobileClientSecret,
        String[] scope
) {
}
