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
import com.gachi.gacha.server.member.infra.naver.exception.NaverPublickeyFetchException;
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
        return validate(idToken, null);
    }

    public NaverIdTokenClaims validate(final String idToken, final String expectedNonce) {
        String audience = expectedNonce != null && naverOauthConfig.mobileClientId() != null
                && !naverOauthConfig.mobileClientId().isBlank()
                ? naverOauthConfig.mobileClientId() : naverOauthConfig.clientId();
        return validate(idToken, expectedNonce, audience);
    }

    private NaverIdTokenClaims validate(final String idToken, final String expectedNonce, final String audience) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            Jwk jwk = jwkProvider.get(unverified.getKeyId());
            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);

            var verifier = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .withAudience(audience)
                    .acceptLeeway(60);
            if (expectedNonce != null) {
                verifier.withClaim("nonce", expectedNonce);
            }
            DecodedJWT decoded = verifier.build().verify(idToken);

            return NaverIdTokenClaims.from(decoded);
        } catch (JwkException e) {
            log.error("Naver 공개키 조회 중 네트워크 또는 서버 오류 발생: {}", e.getMessage(), e);
            throw new NaverPublickeyFetchException(ErrorCode.NAVER_SERVER_ERROR);
        } catch (JWTVerificationException e) {
            log.warn("Naver ID Token 검증 실패: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            throw new UnAuthorizationNaverTokenException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}
