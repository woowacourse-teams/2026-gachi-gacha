package com.gachi.gacha.server.notification.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "푸시 토큰 삭제 요청")
public record PushTokenDeleteRequest(
        @Schema(
                description = "삭제할 FCM 등록 토큰",
                example = "dXk3...",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank String token
) {
}
