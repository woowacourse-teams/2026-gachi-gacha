package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.time.LocalDateTime;

public record StoreUpdateResult(
        Long storeId,
        LocalDateTime updatedAt
) {

    public static StoreUpdateResult from(final Store store) {
        return new StoreUpdateResult(store.getId(), store.getAggregateUpdatedAt());
    }
}
