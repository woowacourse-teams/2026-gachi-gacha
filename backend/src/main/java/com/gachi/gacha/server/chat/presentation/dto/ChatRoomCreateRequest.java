package com.gachi.gacha.server.chat.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "채팅방 생성 요청")
public record ChatRoomCreateRequest(
        @Schema(
                description = "채팅을 요청할 교환 게시글 ID. 본인 게시글은 지정할 수 없다.",
                example = "1",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotNull Long tradeId
) {
}
