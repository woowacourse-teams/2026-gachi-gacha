package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.usecase.application.dto.GachaSummaryInfo;
import lombok.Builder;

@Builder
public record GachaSummaryResponse(
        Long gachaId,
        String thumbnailUrl
) {
    public static GachaSummaryResponse from(GachaSummaryInfo gachaSummaryInfo) {
        return GachaSummaryResponse.builder()
                .gachaId(gachaSummaryInfo.gachaId())
                .thumbnailUrl(gachaSummaryInfo.thumbnailUrl())
                .build();
    }
}
