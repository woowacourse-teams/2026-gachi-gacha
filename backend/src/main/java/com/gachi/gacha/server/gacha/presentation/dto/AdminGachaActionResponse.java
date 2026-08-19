package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.AdminGachaResult;
import com.gachi.gacha.server.gacha.domain.GachaStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminGachaActionResponse(
        Long gachaId,
        String name,
        GachaStatus status,
        LocalDateTime updatedAt
) {
    public static AdminGachaActionResponse from(final AdminGachaResult result) {
        return AdminGachaActionResponse.builder()
                .gachaId(result.gachaId())
                .name(result.name())
                .status(result.status())
                .updatedAt(result.updatedAt())
                .build();
    }
}
