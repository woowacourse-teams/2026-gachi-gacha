package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.trade.domain.Place;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeCreateCommand(
        String title,
        List<Long> categoryIds,
        String description,
        String desiredProduction,
        Place purchaseStore,
        Place tradePlace,
        LocalDateTime availableTime
) {
}
