package com.gachi.gacha.server.favorite.gacha.presentation.dto;

import com.gachi.gacha.server.favorite.gacha.application.dto.FavoriteCountsInfo;
import lombok.Builder;

@Builder
public record FavoriteCountsResponse(
        Long counts
) {
    public static FavoriteCountsResponse from(final FavoriteCountsInfo favoriteCountsInfo) {
        return FavoriteCountsResponse.builder()
                .counts(favoriteCountsInfo.counts())
                .build();
    }
}
