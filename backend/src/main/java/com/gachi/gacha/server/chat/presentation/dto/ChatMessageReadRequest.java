package com.gachi.gacha.server.chat.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "읽음 처리 요청")
public record ChatMessageReadRequest(
        @Schema(
                description = "이 sequence 까지 읽은 것으로 표시한다. 이미 읽은 지점보다 과거 값이면 무시된다.",
                example = "42",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotNull Long lastReadSequence
) {
}
