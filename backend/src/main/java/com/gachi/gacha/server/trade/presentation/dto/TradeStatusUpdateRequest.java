package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.TradeStatus;
import jakarta.validation.constraints.NotNull;

public record TradeStatusUpdateRequest(
        @NotNull
        TradeStatus status
) {
}
