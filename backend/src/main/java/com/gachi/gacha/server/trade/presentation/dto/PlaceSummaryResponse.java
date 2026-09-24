package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record PlaceSummaryResponse(
        @Nullable String name,
        String address
) {
    public static PlaceSummaryResponse from(@Nullable final Place place) {
        if (place == null) {
            return null;
        }
        return PlaceSummaryResponse.builder()
                .name(place.getName())
                .address(place.getAddress())
                .build();
    }
}
