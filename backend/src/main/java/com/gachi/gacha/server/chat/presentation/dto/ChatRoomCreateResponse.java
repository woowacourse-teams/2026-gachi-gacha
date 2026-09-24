package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatRoomCreateInfo;
import java.time.LocalDateTime;

public record ChatRoomCreateResponse(
        Long roomId,
        Long tradeId,
        LocalDateTime createdAt
) {

    public static ChatRoomCreateResponse of(final ChatRoomCreateInfo chatRoomCreateInfo) {
        return new ChatRoomCreateResponse(
                chatRoomCreateInfo.roomId(),
                chatRoomCreateInfo.tradeId(),
                chatRoomCreateInfo.createdAt());
    }
}
