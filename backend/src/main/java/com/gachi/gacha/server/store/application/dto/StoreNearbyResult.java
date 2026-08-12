package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.common.util.BaseUtils;
import com.gachi.gacha.server.store.domain.Store;
import java.util.List;
import lombok.Builder;

public record StoreNearbyResult(
        CenterInfo center,
        Integer radius,
        List<StoreInfo> stores
) {

    public static StoreNearbyResult of(
            final Double latitude,
            final Double longitude,
            final Integer radius,
            final List<StoreInfo> stores
    ) {
        return new StoreNearbyResult(
                new CenterInfo(latitude, longitude),
                radius,
                BaseUtils.copyOrEmpty(stores)
        );
    }

    public record CenterInfo(
            Double latitude,
            Double longitude
    ) {
    }

    @Builder
    public record StoreInfo(
            Long storeId,
            String thumbnailUrl,
            Double latitude,
            Double longitude,
            Double distance
    ) {

        public static StoreInfo of(final Store store, final Double distance) {
            return new StoreInfo(
                    store.getId(),
                    store.getThumbnailUrl(),
                    store.getLatitude(),
                    store.getLongitude(),
                    distance
            );
        }

        public static StoreInfo from(final Store store) {
            return StoreInfo.builder()
                    .storeId(store.getId())
                    .latitude(store.getLatitude())
                    .longitude(store.getLongitude())
                    .thumbnailUrl(store.getThumbnailUrl())
                    .build();
        }
    }
}
