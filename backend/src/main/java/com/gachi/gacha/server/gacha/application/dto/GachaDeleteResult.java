package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import lombok.Builder;

@Builder
public record GachaDeleteResult(
        Long gachaId
) {
    public static GachaDeleteResult from(Gacha gacha) {
        return GachaDeleteResult.builder()
                .gachaId(gacha.getId())
                .build();
    }
}
