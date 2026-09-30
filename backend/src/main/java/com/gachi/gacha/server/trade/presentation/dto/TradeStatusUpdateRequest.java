package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.TradeStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "교환 게시글 상태 변경 요청")
public record TradeStatusUpdateRequest(
        @Schema(
                description = "변경할 거래 상태",
                example = "IN_PROGRESS",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotNull
        TradeStatus status
) {
}
