package com.gachi.gacha.server.chat.application.dto;

import com.gachi.gacha.server.chat.domain.ChatRoom;
import java.time.LocalDateTime;

public record ChatRoomCreateInfo(
        Long roomId,
        Long tradeId,
        LocalDateTime createdAt
) {

    public static ChatRoomCreateInfo from(final ChatRoom chatRoom) {
        return new ChatRoomCreateInfo(
                chatRoom.getId(),
                chatRoom.getTradeId(),
                chatRoom.getCreatedAt()
        );
    }
}
