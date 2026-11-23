package com.gachi.gacha.server.gacha.application.dto;

import java.util.Set;
import lombok.Builder;

@Builder
public record InferenceGacha(
        Long gachaId,
        Double score,
        Set<Long> categoryIds
) {
}
