package com.gachi.gacha.server.member.infra.kakao.dto;

import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(SnakeCaseStrategy.class)
public record KakaoToken(
        String tokenType,
        String accessToken,
        String idToken,
        Integer expiresIn,
        String refreshToken,
        Integer refreshTokenExpiresIn,
        String scope
) {
}
