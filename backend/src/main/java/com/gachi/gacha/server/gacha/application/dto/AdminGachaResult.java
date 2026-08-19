package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminGachaResult(
        Long gachaId,
        String name,
        GachaStatus status,
        LocalDateTime updatedAt
) {
    public static AdminGachaResult from(final Gacha gacha) {
        return AdminGachaResult.builder()
                .gachaId(gacha.getId())
                .name(gacha.getName())
                .status(gacha.getStatus())
                .updatedAt(gacha.getUpdatedAt())
                .build();
    }
}
