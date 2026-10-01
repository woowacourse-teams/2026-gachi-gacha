package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;

public record StoreListResult(
        Long storeId,
        String name,
        String thumbnailUrl,
        String address,
        Double latitude,
        Double longitude,
        Integer gachaMachineAmount
) {

    public static StoreListResult of(
            final Store store,
            final StoreDetail storeDetail,
            final String thumbnailUrl
    ) {
        return new StoreListResult(
                store.getId(),
                store.getName(),
                thumbnailUrl,
                store.getAddress(),
                store.getLatitude(),
                store.getLongitude(),
                storeDetail.getMachineAmount()
        );
    }
}
