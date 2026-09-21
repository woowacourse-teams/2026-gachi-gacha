package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.gacha.domain.Category;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeCategory;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeInfo(
        Long tradeId,
        Long memberId,
        String title,
        String description,
        String desiredProduction,
        List<String> categories,
        TradeStatus status,
        String purchaseStoreAddress,
        String tradePlace,
        LocalDateTime availableTime,
        List<String> imageUrls,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    /**
     * 이미지는 Trade 에 컬렉션 매핑이 없어 엔티티만으로는 채울 수 없다. 조회한 URL 목록을 함께 받는다.
     */
    public static TradeInfo of(final Trade trade, final List<String> imageUrls) {
        List<String> categories = trade.getTradeCategories().stream()
                .map(TradeCategory::getCategory)
                .map(Category::getName)
                .toList();

        return TradeInfo.builder()
                .tradeId(trade.getId())
                .memberId(trade.getMember().getId())
                .title(trade.getTitle())
                .description(trade.getDescription())
                .desiredProduction(trade.getDesiredProduction())
                .categories(categories)
                .status(trade.getStatus())
                .purchaseStoreAddress(trade.getPurchaseStoreAddress())
                .tradePlace(trade.getTradePlace())
                .availableTime(trade.getAvailableTime())
                .imageUrls(imageUrls)
                .createdAt(trade.getCreatedAt())
                .updatedAt(trade.getUpdatedAt())
                .build();
    }
}
