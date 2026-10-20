package com.gachi.gacha.server.member.infra.apple.jwt;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.infra.apple.AppleOauthConfig;
import com.gachi.gacha.server.member.infra.apple.exception.UnAuthorizationAppleTokenException;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AppleIdTokenValidator {

    private static final String ISSUER = "https://appleid.apple.com";

    private final JwkProvider jwkProvider;
    private final AppleOauthConfig config;

    public AppleIdTokenValidator(final AppleOauthConfig config) throws MalformedURLException {
        this.config = config;
        this.jwkProvider = new JwkProviderBuilder(new URL("https://appleid.apple.com/auth/keys"))
                .cached(10, Duration.ofHours(10))
                .build();
    }

    public AppleIdTokenClaims validate(final String idToken, final String expectedNonce) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            Jwk jwk = jwkProvider.get(unverified.getKeyId());
            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);

            DecodedJWT decoded = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .withAudience(config.clientId())
                    .withClaim("nonce", expectedNonce)
                    .build()
                    .verify(idToken);
            return AppleIdTokenClaims.from(decoded);
        } catch (JwkException | JWTVerificationException e) {
            log.warn("Apple ID Token 검증 실패: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            throw new UnAuthorizationAppleTokenException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}
