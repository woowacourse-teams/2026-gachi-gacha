package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import java.util.Arrays;
import java.util.List;

public record StoreNearbyResponse(
        CenterResponse center,
        Integer radius,
        List<StoreItemResponse> stores
) {

    public static StoreNearbyResponse from(final StoreNearbyResult result) {
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

        private static CenterResponse from(final StoreNearbyResult.CenterInfo center) {
            return new CenterResponse(center.latitude(), center.longitude());
        }
    }

    public record StoreItemResponse(
            Long storeId,
            String name,
            String thumbnailUrl,
            String address,
            Integer floor,
            List<String> unit,
            Double latitude,
            Double longitude,
            Double distance
    ) {

        private static StoreItemResponse from(final StoreNearbyResult.StoreInfo store) {
            return new StoreItemResponse(
                    store.storeId(),
                    store.name(),
                    store.thumbnailUrl(),
                    store.address(),
                    store.floor(),
                    parseUnits(store.unit()),
                    store.latitude(),
                    store.longitude(),
                    store.distance()
            );
        }

        private static List<String> parseUnits(final String unit) {
            if (unit == null || unit.isBlank()) {
                return List.of();
            }

            return Arrays.stream(unit.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .toList();
        }
    }
}
