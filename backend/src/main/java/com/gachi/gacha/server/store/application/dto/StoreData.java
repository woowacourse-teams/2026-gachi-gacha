package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record StoreData(
        Long storeId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static StoreData from(Store store) {
        return StoreData.builder()
                .storeId(store.getId())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
}
