package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import java.util.List;
import org.springframework.data.domain.Page;

public record StoreListData(
        List<StoreItem> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {

    public static StoreListData from(Page<Store> stores) {
        List<StoreItem> items = stores.getContent().stream()
                .map(StoreItem::from)
                .toList();

        return new StoreListData(
                items,
                stores.getNumber(),
                stores.getSize(),
                stores.getTotalElements(),
                stores.getTotalPages(),
                stores.hasNext()
        );
    }

    public record StoreItem(
            Long storeId,
            String name,
            String thumbnailUrl,
            String address,
            Double latitude,
            Double longitude,
            Integer gachaMachineCount
    ) {

        private static StoreItem from(Store store) {
            return new StoreItem(
                    store.getId(),
                    store.getStoreInfo().getName(),
                    store.getThumbnailUrl(),
                    store.getStoreInfo().getAddress(),
                    store.getLatitude(),
                    store.getLongitude(),
                    store.getStoreInfo().getMachineAmount()
            );
        }
    }
}
