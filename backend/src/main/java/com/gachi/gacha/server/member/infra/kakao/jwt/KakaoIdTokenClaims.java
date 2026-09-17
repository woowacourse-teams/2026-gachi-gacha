package com.gachi.gacha.server.member.infra.kakao.jwt;

import com.auth0.jwt.interfaces.DecodedJWT;

public record KakaoIdTokenClaims(
        String sub,
        String nickname,
        String profileImageUrl,
        String email
) {
    public static KakaoIdTokenClaims from(DecodedJWT jwt) {
        return new KakaoIdTokenClaims(
                jwt.getSubject(),
                jwt.getClaim("nickname").asString(),
                jwt.getClaim("picture").asString(),
                jwt.getClaim("email").asString()
        );
    }
}
