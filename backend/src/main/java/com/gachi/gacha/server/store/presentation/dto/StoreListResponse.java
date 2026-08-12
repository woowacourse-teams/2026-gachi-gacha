package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreListResult;

public record StoreListResponse(
        Long storeId,
        String name,
        String thumbnailUrl,
        String address,
        Double latitude,
        Double longitude,
        Integer gachaMachineCount
) {

    public static StoreListResponse from(final StoreListResult result) {
        return new StoreListResponse(
                result.storeId(),
                result.name(),
                result.thumbnailUrl(),
                result.address(),
                result.latitude(),
                result.longitude(),
                result.gachaMachineCount()
        );
    }
}
