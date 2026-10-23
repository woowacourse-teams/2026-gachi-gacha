package com.gachi.gacha.server.member.infra.apple.dto;

import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(SnakeCaseStrategy.class)
public record AppleToken(
        String accessToken,
        String refreshToken,
        String idToken,
        Long expiresIn
) {
}
