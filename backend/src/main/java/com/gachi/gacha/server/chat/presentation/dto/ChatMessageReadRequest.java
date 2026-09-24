package com.gachi.gacha.server.chat.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record ChatMessageReadRequest(
        @NotNull Long lastReadSequence
) {
}
