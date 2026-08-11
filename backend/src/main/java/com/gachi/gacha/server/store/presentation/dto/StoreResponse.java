package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record StoreResponse(
        Long storeId,
        LocalDateTime createdAt
) {
    public static StoreResponse from(StoreCreateResult storeCreateResult) {
        return StoreResponse.builder()
                .storeId(storeCreateResult.storeId())
                .createdAt(storeCreateResult.createdAt())
                .build();
    }
}
