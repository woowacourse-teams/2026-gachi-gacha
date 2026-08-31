package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.CollectionSource;
import com.gachi.gacha.server.gacha.domain.Gacha;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record GachaInfo(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        String productCode,
        List<String> categories,
        CollectionSource source,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GachaInfo from(final Gacha gacha) {
        List<String> categories = gacha.getGachaCategories().stream()
                .map(category -> category.getCategory().getName())
                .toList();
        return GachaInfo.builder()
                .gachaId(gacha.getId())
                .name(gacha.getName())
                .caption(gacha.getCaption())
                .thumbnailUrl(gacha.getThumbnailUrl())
                .productCode(gacha.getProductCode())
                .categories(categories)
                .source(gacha.getSource())
                .createdAt(gacha.getCreatedAt())
                .updatedAt(gacha.getUpdatedAt())
                .build();
    }
}
