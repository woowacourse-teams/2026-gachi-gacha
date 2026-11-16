package com.gachi.gacha.server.favorite.gacha.application.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import java.util.List;
import lombok.Builder;

@Builder
public record FavoriteCountsInfo(
        Long counts,
        List<GachaInfo> gachas
) {
    public static FavoriteCountsInfo of(final List<GachaInfo> infos, final long counts) {
        return FavoriteCountsInfo.builder()
                .gachas(infos)
                .counts(counts)
                .build();
    }
}
