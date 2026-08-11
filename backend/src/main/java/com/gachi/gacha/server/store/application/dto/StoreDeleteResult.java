package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;

public record StoreDeleteResult(
        Long storeId
) {

    public static StoreDeleteResult from(final Store store) {
        return new StoreDeleteResult(store.getId());
    }
}
