package com.gachi.gacha.server.member.infra.naver.jwt;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.infra.naver.NaverOauthConfig;
import com.gachi.gacha.server.member.infra.naver.exception.UnAuthorizationNaverTokenException;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NaverIdTokenValidator {

    private static final String ISSUER = "https://nid.naver.com";

    private final JwkProvider jwkProvider;
    private final NaverOauthConfig naverOauthConfig;

    public NaverIdTokenValidator(final NaverOauthConfig naverOauthConfig) throws MalformedURLException {
        this.naverOauthConfig = naverOauthConfig;
        this.jwkProvider = new UrlJwkProvider(new URL(ISSUER + "/oauth2/jwks"));
    }

    public NaverIdTokenClaims validate(final String idToken) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            Jwk jwk = jwkProvider.get(unverified.getKeyId());
            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);

            DecodedJWT decoded = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .withAudience(naverOauthConfig.clientId())
                    .build()
                    .verify(idToken);

            return NaverIdTokenClaims.from(decoded);
        } catch (JwkException | JWTVerificationException e) {
            throw new UnAuthorizationNaverTokenException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}
