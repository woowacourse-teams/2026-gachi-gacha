package com.gachi.gacha.server.member.infra.kakao;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "oauth.kakao")
public record KakaoOauthConfig(
        String redirectUri,
        String mobileRedirectUri,
        String clientId,
        String mobileClientId,
        String clientSecret,
        String mobileClientSecret,
        String[] scope
) {
}
