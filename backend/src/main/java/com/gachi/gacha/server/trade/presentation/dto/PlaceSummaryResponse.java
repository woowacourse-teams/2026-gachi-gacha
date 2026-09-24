package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

/**
 * 목록에서는 장소를 글자로만 보여주므로 좌표를 내리지 않는다. 지도 핀이 필요해지면 좌표를 추가한다.
 */
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
