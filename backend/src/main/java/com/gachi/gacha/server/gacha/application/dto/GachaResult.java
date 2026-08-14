package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaResult(
        Long gachaId,
        LocalDateTime updatedAt
) {
    public static GachaResult from(final Gacha gacha) {
        return GachaResult.builder()
                .gachaId(gacha.getId())
                .updatedAt(gacha.getUpdatedAt())
                .build();
    }
}
