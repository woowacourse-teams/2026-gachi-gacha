package com.gachi.gacha.server.store.presentation.dto;

import lombok.Builder;

@Builder
public record StoreImageDeleteResponse(
        Long storeImageId
) {
    public static StoreImageDeleteResponse from(final Long storeImageId) {
        return StoreImageDeleteResponse.builder()
                .storeImageId(storeImageId)
                .build();
    }
}
