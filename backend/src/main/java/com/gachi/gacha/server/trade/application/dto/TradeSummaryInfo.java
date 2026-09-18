package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeCategory;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record TradeSummaryInfo(
        Long tradeId,
        Long memberId,
        String title,
        TradeStatus status,
        List<String> categories,
        @Nullable String thumbnailUrl,
        String tradePlace,
        LocalDateTime createdAt
) {
    /**
     * 목록의 썸네일은 게시글 이미지 중 첫 번째(등록 순서 기준)를 쓴다. 이미지가 없으면 {@code null}이다.
     */
    public static TradeSummaryInfo of(final Trade trade, final List<String> imageUrls) {
        List<String> categories = trade.getTradeCategories().stream()
                .map(TradeCategory::getCategory)
                .map(category -> category.getName())
                .toList();

        String thumbnailUrl = imageUrls.isEmpty() ? null : imageUrls.getFirst();

        return TradeSummaryInfo.builder()
                .tradeId(trade.getId())
                .memberId(trade.getMember().getId())
                .title(trade.getTitle())
                .status(trade.getStatus())
                .categories(categories)
                .thumbnailUrl(thumbnailUrl)
                .tradePlace(trade.getTradePlace())
                .createdAt(trade.getCreatedAt())
                .build();
    }
}
