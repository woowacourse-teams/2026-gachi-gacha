package com.gachi.gacha.server.notification.presentation.dto;

import com.gachi.gacha.server.notification.application.dto.PushTokenRegisterCommand;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "푸시 토큰 등록 요청")
public record PushTokenRegisterRequest(
        @Schema(
                description = "기기의 FCM 등록 토큰",
                example = "dXk3...",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank String token,

        @Schema(
                description = "기기 플랫폼",
                example = "IOS",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotNull PushPlatform platform
) {
    public PushTokenRegisterCommand toCommand() {
        return new PushTokenRegisterCommand(token, platform);
    }
}
