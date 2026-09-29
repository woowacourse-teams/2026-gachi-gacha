package com.gachi.gacha.server.chat.application.dto;

public record ChatRoomUpdateInfo(
        ChatRoomInfo room,
        long totalUnreadCount
) {
}
