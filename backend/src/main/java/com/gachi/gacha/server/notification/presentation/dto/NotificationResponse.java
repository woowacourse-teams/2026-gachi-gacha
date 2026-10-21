package com.gachi.gacha.server.notification.presentation.dto;

import com.gachi.gacha.server.notification.application.dto.NotificationInfo;
import com.gachi.gacha.server.notification.domain.NotificationType;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record NotificationResponse(
        Long notificationId,
        NotificationType type,
        String title,
        String body,
        Long tradeId,
        Long commentId,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(final NotificationInfo info) {
        return NotificationResponse.builder()
                .notificationId(info.notificationId())
                .type(info.type())
                .title(info.title())
                .body(info.body())
                .tradeId(info.tradeId())
                .commentId(info.commentId())
                .read(info.read())
                .createdAt(info.createdAt())
                .build();
    }
}
