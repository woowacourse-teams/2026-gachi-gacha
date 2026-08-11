package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreData;
import java.time.LocalDateTime;

public record StoreUpdateResponse(
        Long storeId,
        LocalDateTime updatedAt
) {

    public static StoreUpdateResponse from(StoreData storeData) {
        return new StoreUpdateResponse(
                storeData.storeId(),
                storeData.updatedAt()
        );
    }
}
