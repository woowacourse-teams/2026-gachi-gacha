package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.trade.application.dto.TradeInferenceSource;
import java.util.List;
import lombok.Builder;

@Builder
public record GachaSearchCondition(
        String keyword,
        List<Long> categoryIds,
        Double lat,
        Double lon,
        Double distanceKm,
        int page,
        int size
) {
    public static GachaSearchCondition toCondition(final TradeInferenceSource source) {
        return GachaSearchCondition.builder()
                .keyword(source.keyword())
                .categoryIds(source.categoryIds())
                .page(0)
                .size(1)
                .build();
    }
}
