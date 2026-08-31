package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.CollectionSource;
import com.gachi.gacha.server.gacha.domain.Gacha;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaInfo(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        String productCode,
        String category,
        CollectionSource source,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GachaInfo from(final Gacha gacha) {
        return GachaInfo.builder()
                .gachaId(gacha.getId())
                .name(gacha.getName())
                .caption(gacha.getCaption())
                .thumbnailUrl(gacha.getThumbnailUrl())
                .productCode(gacha.getProductCode())
                .category(gacha.getCategory())
                .source(gacha.getSource())
                .createdAt(gacha.getCreatedAt())
                .updatedAt(gacha.getUpdatedAt())
                .build();
    }
}
