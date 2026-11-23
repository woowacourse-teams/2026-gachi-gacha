package com.gachi.gacha.server.news.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "신상 소식 알림 구독 상태")
public record NewsSubscriptionResponse(
        @Schema(description = "푸시 알림을 받는지. 기본값은 받지 않음") boolean subscribed
) {
}
