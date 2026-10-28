package com.gachi.gacha.server.notification.presentation.dto;

import com.gachi.gacha.server.notification.application.dto.NotificationPageInfo;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record NotificationPageResponse(
        List<NotificationResponse> notifications,
        @Nullable Long nextLastNotificationId,
        boolean hasNext
) {
    public static NotificationPageResponse from(final NotificationPageInfo info) {
        return NotificationPageResponse.builder()
                .notifications(info.notifications().stream()
                        .map(NotificationResponse::from)
                        .toList())
                .nextLastNotificationId(info.nextLastNotificationId())
                .hasNext(info.hasNext())
                .build();
    }
}
