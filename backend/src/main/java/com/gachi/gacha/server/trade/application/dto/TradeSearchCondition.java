package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeSearchCondition(
        String keyword,
        List<Long> categoryIds,
        TradeStatus status
) {
}
