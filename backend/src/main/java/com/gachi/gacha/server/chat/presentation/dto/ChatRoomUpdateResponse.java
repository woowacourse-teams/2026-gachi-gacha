package com.gachi.gacha.server.chat.presentation.dto;

public record ChatRoomUpdateResponse(
        ChatRoomResponse room,
        long totalUnreadCount
) {
}

