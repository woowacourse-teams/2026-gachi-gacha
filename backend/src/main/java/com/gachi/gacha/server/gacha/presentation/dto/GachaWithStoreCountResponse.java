package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaWithStoreCountInfo;
import com.gachi.gacha.server.gacha.domain.CollectionSource;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record GachaWithStoreCountResponse(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        String productCode,
        List<String> categories,
        CollectionSource source,
        Integer storeCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GachaWithStoreCountResponse from(final GachaWithStoreCountInfo gachaWithStoreCountInfo) {
        return GachaWithStoreCountResponse.builder()
                .gachaId(gachaWithStoreCountInfo.gachaId())
                .name(gachaWithStoreCountInfo.name())
                .caption(gachaWithStoreCountInfo.caption())
                .thumbnailUrl(gachaWithStoreCountInfo.thumbnailUrl())
                .productCode(gachaWithStoreCountInfo.productCode())
                .categories(gachaWithStoreCountInfo.categories())
                .source(gachaWithStoreCountInfo.source())
                .storeCount(gachaWithStoreCountInfo.storeCount())
                .createdAt(gachaWithStoreCountInfo.createdAt())
                .updatedAt(gachaWithStoreCountInfo.updatedAt())
                .build();
    }
}
