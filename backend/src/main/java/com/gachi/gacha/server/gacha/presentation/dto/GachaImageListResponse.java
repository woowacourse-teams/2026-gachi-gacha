package com.gachi.gacha.server.gacha.presentation.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record GachaImageListResponse(
        List<GachaImageResponse> items
) {
    public static GachaImageListResponse from(final List<GachaImageResponse> items) {
        return GachaImageListResponse.builder()
                .items(items)
                .build();
    }
}
