package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.time.LocalDateTime;

public record StoreCreateResult(
        Long storeId,
        LocalDateTime createdAt
) {

    public static StoreCreateResult from(Store store) {
        return new StoreCreateResult(store.getId(), store.getCreatedAt());
    }
}
