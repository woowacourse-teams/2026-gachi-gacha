package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record PlaceResponse(
        @Nullable String name,
        String address,
        Double latitude,
        Double longitude
) {
    public static PlaceResponse from(@Nullable final Place place) {
        if (place == null) {
            return null;
        }
        return PlaceResponse.builder()
                .name(place.getName())
                .address(place.getAddress())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .build();
    }
}
