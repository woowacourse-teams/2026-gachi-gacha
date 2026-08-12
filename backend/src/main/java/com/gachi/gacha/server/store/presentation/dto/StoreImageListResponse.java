package com.gachi.gacha.server.store.presentation.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record StoreImageListResponse(
        List<StoreImageResponse> items
) {
    public static StoreImageListResponse from(final List<StoreImageResponse> items) {
        return StoreImageListResponse.builder()
                .items(items)
                .build();
    }
}
