package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreGachaInfo;
import lombok.Builder;

@Builder
public record StoreGachaResponse(
        Long storeId,
        Long gachaId
) {
    public static StoreGachaResponse from(final StoreGachaInfo storeGachaInfo) {
        return StoreGachaResponse.builder()
                .storeId(storeGachaInfo.storeId())
                .gachaId(storeGachaInfo.gachaId())
                .build();
    }
}
