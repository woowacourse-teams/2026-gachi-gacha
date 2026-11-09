package com.gachi.gacha.server.favorite.gacha.application.dto;

import lombok.Builder;

@Builder
public record FavoriteCountsInfo(
        Long counts
) {
    public static FavoriteCountsInfo from(final long counts) {
        return FavoriteCountsInfo.builder()
                .counts(counts)
                .build();
    }
}
