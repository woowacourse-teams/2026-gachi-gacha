package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.category.domain.Category;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeCategory;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record TradeDocument(
        Long tradeId,
        Long memberId,
        String title,
        TradeStatus status,
        List<Long> categoryIds,
        List<String> categories,
        String thumbnailUrl,
        LocalDateTime createdAt
) {
    public static TradeDocument of(final Trade trade, final String thumbnailUrl) {
        List<String> categories = trade.getTradeCategories()
                .stream()
                .map(TradeCategory::getCategory)
                .map(Category::getName)
                .toList();
        List<Long> categoryIds = trade.getTradeCategories()
                .stream()
                .map(TradeCategory::getCategory)
                .map(Category::getId)
                .toList();

        return TradeDocument.builder()
                .tradeId(trade.getId())
                .memberId(trade.getMember().getId())
                .title(trade.getTitle())
                .status(trade.getStatus())
                .thumbnailUrl(thumbnailUrl)
                .categoryIds(categoryIds)
                .categories(categories)
                .createdAt(trade.getCreatedAt())
                .build();
    }
}
