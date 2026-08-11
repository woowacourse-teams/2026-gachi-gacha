package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record StoreCreateResult(
        Long storeId,
        LocalDateTime createdAt
) {
    public static StoreCreateResult from(Store store) {
        return StoreCreateResult.builder()
                .storeId(store.getId())
                .createdAt(store.getCreatedAt())
                .build();
    }
}
