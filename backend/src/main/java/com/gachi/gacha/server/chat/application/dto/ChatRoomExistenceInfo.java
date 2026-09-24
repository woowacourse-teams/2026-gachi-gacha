package com.gachi.gacha.server.chat.application.dto;

import jakarta.annotation.Nullable;

public record ChatRoomExistenceInfo(
        boolean isExist,
        @Nullable Long roomId
) {

    public static ChatRoomExistenceInfo of(final boolean isExist, final Long roomId) {
        return new ChatRoomExistenceInfo(isExist, roomId);
    }

}
