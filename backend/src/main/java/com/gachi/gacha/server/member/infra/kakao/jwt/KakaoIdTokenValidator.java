package com.gachi.gacha.server.member.infra.kakao.jwt;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.infra.kakao.exception.KakaoPublickeyFetchException;
import com.gachi.gacha.server.member.infra.kakao.exception.UnAuthorizationKakaoTokenException;
import com.gachi.gacha.server.member.infra.kakao.KakaoOauthConfig;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class KakaoIdTokenValidator {

    private static final String ISSUER = "https://kauth.kakao.com";

    private final JwkProvider jwkProvider;
    private final KakaoOauthConfig kakaoOauthConfig;

    public KakaoIdTokenValidator(final KakaoOauthConfig kakaoOauthConfig) {
        this.kakaoOauthConfig = kakaoOauthConfig;
        this.jwkProvider = new JwkProviderBuilder(ISSUER)
                .cached(5, Duration.ofHours(10))
                .build();
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
        } catch (JwkException e) {
            log.error("Kakao 공개키 조회 중 네트워크 또는 서버 오류 발생: {}", e.getMessage(), e);
            throw new KakaoPublickeyFetchException(ErrorCode.KAKAO_SERVER_ERROR);
        } catch (JWTVerificationException e) {
            log.warn("카카오 ID Token 검증 실패: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            throw new UnAuthorizationKakaoTokenException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}
