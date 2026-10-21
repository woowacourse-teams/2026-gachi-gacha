package com.gachi.gacha.server.notification.application.dto;

import com.gachi.gacha.server.notification.domain.Notification;
import com.gachi.gacha.server.notification.domain.NotificationMessage;
import com.gachi.gacha.server.notification.domain.NotificationType;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record NotificationInfo(
        Long notificationId,
        NotificationType type,
        String title,
        String body,
        Long tradeId,
        Long commentId,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationInfo from(final Notification notification) {
        NotificationMessage message = NotificationMessage.from(notification);

        return NotificationInfo.builder()
                .notificationId(notification.getId())
                .type(notification.getType())
                .title(message.title())
                .body(message.body())
                .tradeId(notification.getTradeId())
                .commentId(notification.getCommentId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
