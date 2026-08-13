package com.gachi.gacha.server.usecase.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import lombok.Builder;

@Builder
public record GachaSummaryInfo(
        Long gachaId,
        String thumbnailUrl
) {
    public static GachaSummaryInfo from(final Gacha gacha) {
        return GachaSummaryInfo.builder()
                .gachaId(gacha.getId())
                .thumbnailUrl(gacha.getThumbnailUrl())
                .build();
    }
}
