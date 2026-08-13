package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.usecase.domain.StoreGacha;
import lombok.Builder;

@Builder
public record StoreGachaInfo(
        Long storeId,
        Long gachaId
) {
    public static StoreGachaInfo from(final StoreGacha storeGacha) {
        return StoreGachaInfo.builder()
                .storeId(storeGacha.getStore().getId())
                .gachaId(storeGacha.getGacha().getId())
                .build();
    }
}
