package com.gachi.gacha.server.member.infra.naver.jwt;

import com.auth0.jwt.interfaces.DecodedJWT;

public record NaverIdTokenClaims(
        String sub,
        String nickname,
        String profileImageUrl,
        String email
) {
    public static NaverIdTokenClaims from(final DecodedJWT jwt) {
        return new NaverIdTokenClaims(
                jwt.getSubject(),
                jwt.getClaim("name").asString(),
                jwt.getClaim("profile_image").asString(),
                jwt.getClaim("email").asString()
        );
    }
}
