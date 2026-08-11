package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.util.List;

public record StoreNearbyResult(
        CenterInfo center,
        int radius,
        List<StoreInfo> stores
) {

    public static StoreNearbyResult of(
            Double latitude,
            Double longitude,
            int radius,
            List<StoreInfo> stores
    ) {
        return new StoreNearbyResult(
                new CenterInfo(latitude, longitude),
                radius,
                List.copyOf(stores)
        );
    }

    public record CenterInfo(
            Double latitude,
            Double longitude
    ) {
    }

    public record StoreInfo(
            Long storeId,
            String thumbnailUrl,
            Double latitude,
            Double longitude,
            long distance
    ) {

        public static StoreInfo of(Store store, long distance) {
            return new StoreInfo(
                    store.getId(),
                    store.getThumbnailUrl(),
                    store.getLatitude(),
                    store.getLongitude(),
                    distance
            );
        }
    }
}
