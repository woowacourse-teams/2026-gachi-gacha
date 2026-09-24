package com.gachi.gacha.server.chat.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record ChatRoomCreateRequest(
        @NotNull Long tradeId
) {
}
