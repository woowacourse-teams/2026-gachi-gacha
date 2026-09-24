package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.trade.domain.Place;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

/**
 * 목록에서는 장소를 글자로만 보여주므로 좌표를 내리지 않는다. 지도 핀이 필요해지면 좌표를 추가한다.
 */
@Builder
public record PlaceSummaryInfo(
        @Nullable String name,
        String address
) {
    public static PlaceSummaryInfo from(@Nullable final Place place) {
        if (place == null) {
            return null;
        }
        return PlaceSummaryInfo.builder()
                .name(place.getName())
                .address(place.getAddress())
                .build();
    }
}
