package com.gachi.gacha.server.notification.application.dto;

import com.gachi.gacha.server.notification.domain.Notification;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record NotificationPageInfo(
        List<NotificationInfo> notifications,
        @Nullable Long nextLastNotificationId,
        boolean hasNext
) {

    /**
     * 다음 페이지가 있는지 알기 위해 pageSize + 1 개를 조회한 결과를 받는다.
     */
    public static NotificationPageInfo of(final List<Notification> queriedNotifications, final int pageSize) {
        boolean hasNext = queriedNotifications.size() > pageSize;
        List<NotificationInfo> notifications = queriedNotifications.stream()
                .limit(pageSize)
                .map(NotificationInfo::from)
                .toList();
        Long nextLastNotificationId = notifications.isEmpty()
                ? null
                : notifications.getLast().notificationId();

        return NotificationPageInfo.builder()
                .notifications(notifications)
                .nextLastNotificationId(nextLastNotificationId)
                .hasNext(hasNext)
                .build();
    }
}
