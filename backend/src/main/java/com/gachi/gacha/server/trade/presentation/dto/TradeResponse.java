package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeResponse(
        Long tradeId,
        Long memberId,
        String title,
        String description,
        String desiredProduction,
        List<String> categories,
        TradeStatus status,
        PlaceResponse purchaseStore,
        PlaceResponse tradePlace,
        LocalDateTime availableTime,
        List<String> imageUrls,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TradeResponse from(final TradeInfo tradeInfo) {
        return TradeResponse.builder()
                .tradeId(tradeInfo.tradeId())
                .memberId(tradeInfo.memberId())
                .title(tradeInfo.title())
                .description(tradeInfo.description())
                .desiredProduction(tradeInfo.desiredProduction())
                .categories(tradeInfo.categories())
                .status(tradeInfo.status())
                .purchaseStore(PlaceResponse.from(tradeInfo.purchaseStore()))
                .tradePlace(PlaceResponse.from(tradeInfo.tradePlace()))
                .availableTime(tradeInfo.availableTime())
                .imageUrls(tradeInfo.imageUrls())
                .createdAt(tradeInfo.createdAt())
                .updatedAt(tradeInfo.updatedAt())
                .build();
    }
}
