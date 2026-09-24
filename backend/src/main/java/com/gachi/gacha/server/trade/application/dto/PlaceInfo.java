package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.trade.domain.Place;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record PlaceInfo(
        @Nullable String name,
        String address,
        Double latitude,
        Double longitude
) {
    /**
     * 장소를 등록하지 않은 게시글은 컬럼이 전부 비어 있어 {@code Place} 자체가 {@code null}이다.
     */
    public static PlaceInfo from(@Nullable final Place place) {
        if (place == null) {
            return null;
        }
        return PlaceInfo.builder()
                .name(place.getName())
                .address(place.getAddress())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .build();
    }
}
