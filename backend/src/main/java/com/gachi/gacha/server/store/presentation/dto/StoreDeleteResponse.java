package com.gachi.gacha.server.store.presentation.dto;

public record StoreDeleteResponse(
        Long storeId
) {

    public static StoreDeleteResponse from(Long storeId) {
        return new StoreDeleteResponse(storeId);
    }
}
