package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreDeleteResult;

public record StoreDeleteResponse(
        Long storeId
) {

    public static StoreDeleteResponse from(final StoreDeleteResult result) {
        return new StoreDeleteResponse(result.storeId());
    }
}
