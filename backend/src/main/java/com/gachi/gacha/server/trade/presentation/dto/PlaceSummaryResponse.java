package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.PlaceSummaryInfo;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record PlaceSummaryResponse(
        @Nullable String name,
        String address
) {
    public static PlaceSummaryResponse from(@Nullable final PlaceSummaryInfo placeSummaryInfo) {
        if (placeSummaryInfo == null) {
            return null;
        }
        return PlaceSummaryResponse.builder()
                .name(placeSummaryInfo.name())
                .address(placeSummaryInfo.address())
                .build();
    }
}
