package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeSummaryResponse(
        Long tradeId,
        Long memberId,
        String title,
        TradeStatus status,
        List<String> categories,
        String thumbnailUrl,
        PlaceSummaryResponse tradePlace,
        LocalDateTime createdAt
) {
    public static TradeSummaryResponse from(final TradeSummaryInfo tradeSummaryInfo) {
        return TradeSummaryResponse.builder()
                .tradeId(tradeSummaryInfo.tradeId())
                .memberId(tradeSummaryInfo.memberId())
                .title(tradeSummaryInfo.title())
                .status(tradeSummaryInfo.status())
                .categories(tradeSummaryInfo.categories())
                .thumbnailUrl(tradeSummaryInfo.thumbnailUrl())
                .tradePlace(PlaceSummaryResponse.from(tradeSummaryInfo.tradePlace()))
                .createdAt(tradeSummaryInfo.createdAt())
                .build();
    }
}
