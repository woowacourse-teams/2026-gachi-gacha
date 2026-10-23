package com.gachi.gacha.server.member.infra.apple.jwt;

import com.auth0.jwt.interfaces.DecodedJWT;

public record AppleIdTokenClaims(
        String sub,
        String email
) {

    public static AppleIdTokenClaims from(DecodedJWT jwt) {
        return new AppleIdTokenClaims(jwt.getSubject(), jwt.getClaim("email").asString());
    }
}
