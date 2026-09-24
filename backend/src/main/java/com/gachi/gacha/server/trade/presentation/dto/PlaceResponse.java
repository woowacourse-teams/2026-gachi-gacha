package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.PlaceInfo;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record PlaceResponse(
        @Nullable String name,
        String address,
        Double latitude,
        Double longitude
) {
    public static PlaceResponse from(@Nullable final PlaceInfo placeInfo) {
        if (placeInfo == null) {
            return null;
        }
        return PlaceResponse.builder()
                .name(placeInfo.name())
                .address(placeInfo.address())
                .latitude(placeInfo.latitude())
                .longitude(placeInfo.longitude())
                .build();
    }
}
