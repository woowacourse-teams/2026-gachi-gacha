package com.gachi.gacha.server.trade.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeCreateCommand(
        String title,
        List<Long> categoryIds,
        String description,
        String desiredProduction,
        String purchaseStoreAddress,
        String tradePlace,
        LocalDateTime availableTime
) {
}
