package com.gachi.gacha.server.member.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "토큰 재발급·로그아웃 요청")
public record RefreshRequest(
        @Schema(
                description = "로그인 시 발급받은 refreshToken",
                example = "eyJhbGciOiJIUzI1NiJ9...",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        String refreshToken
) {
}
