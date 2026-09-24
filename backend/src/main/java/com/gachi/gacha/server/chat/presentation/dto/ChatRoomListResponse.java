package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import java.util.List;

public record ChatRoomListResponse(
        List<ChatRoomResponse> rooms
) {
    public static ChatRoomListResponse from(final List<ChatRoomInfo> roomsInfo) {
        return new ChatRoomListResponse(
                roomsInfo.stream()
                        .map(ChatRoomResponse::from)
                        .toList()
        );
    }
}
