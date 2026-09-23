package com.gachi.gacha.server.member.infra.naver.dto;

import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

public record NaverProfileResponse(
        String resultcode,
        String message,
        Response response
) {
    @JsonNaming(SnakeCaseStrategy.class)
    public record Response(
            String id,
            String email,
            String name,
            String nickname,
            String profileImage
    ) {
    }
}
