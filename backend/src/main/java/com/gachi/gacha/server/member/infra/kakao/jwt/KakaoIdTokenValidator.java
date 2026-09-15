package com.gachi.gacha.server.member.infra.kakao.jwt;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.infra.kakao.exception.UnAuthorizationKakaoTokenException;
import com.gachi.gacha.server.member.infra.kakao.KakaoOauthConfig;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import org.springframework.stereotype.Component;

@Component
public class KakaoIdTokenValidator {

    private static final String ISSUER = "https://kauth.kakao.com";

    private final JwkProvider jwkProvider;
    private final KakaoOauthConfig kakaoOauthConfig;

    public KakaoIdTokenValidator(final KakaoOauthConfig kakaoOauthConfig) throws MalformedURLException {
        this.kakaoOauthConfig = kakaoOauthConfig;
        this.jwkProvider = new UrlJwkProvider(new URL(ISSUER + "/.well-known/jwks.json"));
    }

    public KakaoIdTokenClaims validate(final String idToken, final String expectedNonce) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            Jwk jwk = jwkProvider.get(unverified.getKeyId());

            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);

            DecodedJWT decoded = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .withAudience(kakaoOauthConfig.clientId())
                    .withClaim("nonce", expectedNonce)
                    .build()
                    .verify(idToken);

            return KakaoIdTokenClaims.from(decoded);
        } catch (JwkException | JWTVerificationException e) {
            throw new UnAuthorizationKakaoTokenException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}
