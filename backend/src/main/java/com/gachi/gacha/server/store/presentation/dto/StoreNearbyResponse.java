package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import java.util.List;

public record StoreNearbyResponse(
        CenterResponse center,
        int radius,
        List<StoreItemResponse> stores
) {

    public static StoreNearbyResponse from(StoreNearbyResult result) {
        List<StoreItemResponse> stores = result.stores().stream()
                .map(StoreItemResponse::from)
                .toList();

        return new StoreNearbyResponse(
                CenterResponse.from(result.center()),
                result.radius(),
                stores
        );
    }

    public record CenterResponse(
            Double latitude,
            Double longitude
    ) {

        private static CenterResponse from(StoreNearbyResult.CenterInfo center) {
            return new CenterResponse(center.latitude(), center.longitude());
        }
    }

    public record StoreItemResponse(
            Long storeId,
            String thumbnailUrl,
            Double latitude,
            Double longitude,
            long distance
    ) {

        private static StoreItemResponse from(StoreNearbyResult.StoreInfo store) {
            return new StoreItemResponse(
                    store.storeId(),
                    store.thumbnailUrl(),
                    store.latitude(),
                    store.longitude(),
                    store.distance()
            );
        }
    }
}
