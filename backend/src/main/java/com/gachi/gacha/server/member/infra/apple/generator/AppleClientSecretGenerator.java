package com.gachi.gacha.server.member.infra.apple.generator;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.gachi.gacha.server.member.infra.apple.AppleOauthConfig;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Date;
import org.springframework.stereotype.Component;

@Component
public class AppleClientSecretGenerator {

    private static final String AUDIENCE = "https://appleid.apple.com";

    private final AppleOauthConfig config;
    private final ECPrivateKey privateKey;

    public AppleClientSecretGenerator(final AppleOauthConfig config) {
        this.config = config;
        this.privateKey = parse(config.privateKey());
    }

    public String generate() {
        return generate(config.clientId());
    }

    public String generate(final String clientId) {
        Date now = new Date();
        return JWT.create()
                .withKeyId(config.keyId())
                .withIssuer(config.teamId())
                .withSubject(clientId)
                .withAudience(AUDIENCE)
                .withIssuedAt(now)
                .withExpiresAt(new Date(now.getTime() + Duration.ofMinutes(5).toMillis()))
                .sign(Algorithm.ECDSA256(null, privateKey));
    }

    private static ECPrivateKey parse(final String pem) {
        try {
            String base64 = pem
                    .replace("\\n", "")
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(base64);
            return (ECPrivateKey) KeyFactory.getInstance("EC")
                    .generatePrivate(new PKCS8EncodedKeySpec(decoded));
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Apple private key 파싱 실패", e);
        }
    }
}
