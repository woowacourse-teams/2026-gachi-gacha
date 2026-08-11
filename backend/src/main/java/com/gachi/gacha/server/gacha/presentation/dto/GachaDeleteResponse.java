package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaDeleteResult;
import lombok.Builder;

@Builder
public record GachaDeleteResponse(
        Long gachaId
) {
    public static GachaDeleteResponse from(GachaDeleteResult result) {
        return GachaDeleteResponse.builder()
                .gachaId(result.gachaId())
                .build();
    }
}
