package com.gachi.gacha.server.notification.presentation.dto;

public record NotificationUnreadCountResponse(
        long unreadCount
) {
    public static NotificationUnreadCountResponse from(final long unreadCount) {
        return new NotificationUnreadCountResponse(unreadCount);
    }
}
