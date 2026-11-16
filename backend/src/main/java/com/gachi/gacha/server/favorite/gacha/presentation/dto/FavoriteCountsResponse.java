package com.gachi.gacha.server.favorite.gacha.presentation.dto;

import com.gachi.gacha.server.favorite.gacha.application.dto.FavoriteCountsInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import java.util.List;
import lombok.Builder;

@Builder
public record FavoriteCountsResponse(
        Long counts,
        List<GachaResponse> gachas
) {
    public static FavoriteCountsResponse from(final FavoriteCountsInfo info) {
        return FavoriteCountsResponse.builder()
                .counts(info.counts())
                .gachas(info.gachas().stream()
                        .map(GachaResponse::from)
                        .toList())
                .build();
    }
}
