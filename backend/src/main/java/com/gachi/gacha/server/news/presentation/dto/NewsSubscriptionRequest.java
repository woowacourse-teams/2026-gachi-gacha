package com.gachi.gacha.server.news.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "신상 소식 알림 구독 변경 요청")
public record NewsSubscriptionRequest(
        @Schema(description = "켜려면 true, 끄려면 false", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull Boolean subscribed
) {
}
