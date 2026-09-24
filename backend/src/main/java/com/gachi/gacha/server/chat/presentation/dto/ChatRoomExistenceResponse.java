package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatRoomExistenceInfo;

public record ChatRoomExistenceResponse(
        boolean isExist,
        Long roomId
) {
    public static ChatRoomExistenceResponse from(final ChatRoomExistenceInfo chatRoomExistenceInfo) {
        return new ChatRoomExistenceResponse(
                chatRoomExistenceInfo.isExist(),
                chatRoomExistenceInfo.roomId()
        );
    }
}
