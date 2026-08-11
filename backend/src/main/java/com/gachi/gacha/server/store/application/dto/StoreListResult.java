package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.util.List;
import org.springframework.data.domain.Page;

public record StoreListResult(
        List<StoreInfo> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {

    public static StoreListResult from(final Page<Store> stores) {
        List<StoreInfo> items = stores.getContent().stream()
                .map(StoreInfo::from)
                .toList();

        return new StoreListResult(
                items,
                stores.getNumber(),
                stores.getSize(),
                stores.getTotalElements(),
                stores.getTotalPages(),
                stores.hasNext()
        );
    }

    public record StoreInfo(
            Long storeId,
            String name,
            String thumbnailUrl,
            String address,
            Double latitude,
            Double longitude,
            Integer gachaMachineCount
    ) {

        private static StoreInfo from(final Store store) {
            return new StoreInfo(
                    store.getId(),
                    store.getStoreDetail().getName(),
                    store.getThumbnailUrl(),
                    store.getStoreDetail().getAddress(),
                    store.getLatitude(),
                    store.getLongitude(),
                    store.getStoreDetail().getMachineAmount()
            );
        }
    }
}
