package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreImageInfo;
import lombok.Builder;

@Builder
public record StoreImageResponse(
        Long storeImageId,
        String imageUrl
) {
    public static StoreImageResponse from(final StoreImageInfo storeImageInfo) {
        return StoreImageResponse.builder()
                .storeImageId(storeImageInfo.storeImageId())
                .imageUrl(storeImageInfo.imageUrl())
                .build();
    }
}
