package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreUpdateResult;
import java.time.LocalDateTime;

public record StoreUpdateResponse(
        Long storeId,
        LocalDateTime updatedAt
) {

    public static StoreUpdateResponse from(final StoreUpdateResult result) {
        return new StoreUpdateResponse(
                result.storeId(),
                result.updatedAt()
        );
    }
}
