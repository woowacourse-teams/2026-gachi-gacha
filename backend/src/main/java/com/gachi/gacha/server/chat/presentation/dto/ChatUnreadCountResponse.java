package com.gachi.gacha.server.chat.presentation.dto;

public record ChatUnreadCountResponse(
        long unreadCount
) {
    public static ChatUnreadCountResponse from(final long unreadCount) {
        return new ChatUnreadCountResponse(unreadCount);
    }
}
