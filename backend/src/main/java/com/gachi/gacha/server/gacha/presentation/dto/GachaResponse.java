package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaResponse(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        LocalDateTime createdAt
) {
    public static GachaResponse from(GachaInfo gachaInfo) {
        return GachaResponse.builder()
                .gachaId(gachaInfo.gachaId())
                .name(gachaInfo.name())
                .caption(gachaInfo.caption())
                .thumbnailUrl(gachaInfo.thumbnailUrl())
                .createdAt(gachaInfo.createdAt())
                .build();
    }
}
