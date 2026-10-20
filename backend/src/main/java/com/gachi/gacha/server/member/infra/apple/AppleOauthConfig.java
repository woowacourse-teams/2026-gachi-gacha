package com.gachi.gacha.server.member.infra.apple;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("oauth.apple")
public record AppleOauthConfig(
        String clientId,      // Services ID (웹) 또는 Bundle ID (앱)
        String teamId,
        String keyId,         // .p8 발급 시 Key ID
        String privateKey,    // .p8 내용 (환경변수/시크릿으로 주입)
        String redirectUri,
        List<String> scope    // ["name", "email"]
) {
}
