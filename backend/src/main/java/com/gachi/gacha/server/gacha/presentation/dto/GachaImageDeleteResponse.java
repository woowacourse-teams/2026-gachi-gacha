package com.gachi.gacha.server.gacha.presentation.dto;

import lombok.Builder;

@Builder
public record GachaImageDeleteResponse(
        Long gachaImageId
) {
    public static GachaImageDeleteResponse from(final Long gachaImageId) {
        return GachaImageDeleteResponse.builder()
                .gachaImageId(gachaImageId)
                .build();
    }
}
