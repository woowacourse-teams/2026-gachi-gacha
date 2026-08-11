package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaInfo(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        LocalDateTime createdAt
) {
    public static GachaInfo from(final Gacha gacha) {
        return GachaInfo.builder()
                .gachaId(gacha.getId())
                .name(gacha.getName())
                .caption(gacha.getCaption())
                .thumbnailUrl(gacha.getThumbnailUrl())
                .createdAt(gacha.getCreatedAt())
                .build();
    }
}
