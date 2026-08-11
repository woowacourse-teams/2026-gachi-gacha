package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreListResult;
import java.util.List;

public record StoreListResponse(
        List<StoreItemResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {

    public static StoreListResponse from(StoreListResult result) {
        List<StoreItemResponse> items = result.items().stream()
                .map(StoreItemResponse::from)
                .toList();

        return new StoreListResponse(
                items,
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages(),
                result.hasNext()
        );
    }

    public record StoreItemResponse(
            Long storeId,
            String name,
            String thumbnailUrl,
            String address,
            Double latitude,
            Double longitude,
            Integer gachaMachineCount
    ) {

        private static StoreItemResponse from(StoreListResult.StoreInfo item) {
            return new StoreItemResponse(
                    item.storeId(),
                    item.name(),
                    item.thumbnailUrl(),
                    item.address(),
                    item.latitude(),
                    item.longitude(),
                    item.gachaMachineCount()
            );
        }
    }
}
