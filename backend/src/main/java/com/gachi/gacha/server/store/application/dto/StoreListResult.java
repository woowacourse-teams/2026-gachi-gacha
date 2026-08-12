package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;

public record StoreListResult(
        Long storeId,
        String name,
        String thumbnailUrl,
        String address,
        Double latitude,
        Double longitude,
        Integer gachaMachineCount
) {

    public static StoreListResult from(final Store store) {
        return new StoreListResult(
                store.getId(),
                store.getStoreDetail().getName(),
                store.getThumbnailUrl(),
                store.getStoreDetail().getAddress(),
                store.getLatitude(),
                store.getLongitude(),
                store.getStoreDetail().getMachineAmount()
        );
    }
}
