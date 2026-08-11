package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaResult;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaUpdateResponse(
        Long gachaId,
        LocalDateTime updatedAt
) {
    public static GachaUpdateResponse from(GachaResult gachaResult) {
        return GachaUpdateResponse.builder()
                .gachaId(gachaResult.gachaId())
                .updatedAt(gachaResult.updatedAt())
                .build();
    }
}
