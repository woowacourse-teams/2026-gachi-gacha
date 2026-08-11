package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import java.time.LocalDateTime;

public record StoreCreateResponse(
        Long storeId,
        LocalDateTime createdAt
) {

    public static StoreCreateResponse from(StoreCreateResult result) {
        return new StoreCreateResponse(result.storeId(), result.createdAt());
    }
}
