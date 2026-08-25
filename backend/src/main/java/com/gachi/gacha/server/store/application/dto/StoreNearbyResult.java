package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.common.util.BaseUtils;
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
            String name,
            String thumbnailUrl,
            Double latitude,
            Double longitude,
            Double distance
    ) {
    }
}
