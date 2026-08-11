package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreImage;
import java.time.LocalDateTime;
import java.util.List;

public record StoreDetailResult(
        Long storeId,
        String name,
        String thumbnailUrl,
        List<StoreImageItem> images,
        Double latitude,
        Double longitude,
        String phoneNumber,
        String instagramId,
        String address,
        String businessHours,
        List<String> paymentMethods,
        Integer gachaMachineCount,
        Long coinPrice,
        Long gachaPriceMin,
        Long gachaPriceMax,
        Integer kujiCount,
        Long kujiPriceMin,
        Long kujiPriceMax,
        Boolean hasSelectGacha,
        Long selectGachaPriceMin,
        Long selectGachaPriceMax,
        List<String> facilities,
        Boolean hasRandomBox,
        long ownedGachaCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static StoreDetailResult from(Store store) {
        List<StoreImageItem> images = store.getStoreImages().stream()
                .map(StoreImageItem::from)
                .toList();

        return new StoreDetailResult(
                store.getId(),
                store.getStoreInfo().getName(),
                store.getThumbnailUrl(),
                images,
                store.getLatitude(),
                store.getLongitude(),
                store.getStoreInfo().getPhone(),
                store.getStoreInfo().getInstagramId(),
                store.getStoreInfo().getAddress(),
                store.getStoreInfo().getBusinessHours(),
                List.copyOf(store.getStoreInfo().getPaymentMethods()),
                store.getStoreInfo().getMachineAmount(),
                store.getStoreInfo().getCoinPrice(),
                store.getStoreInfo().getGachaMinPrice(),
                store.getStoreInfo().getGachaMaxPrice(),
                store.getStoreInfo().getKujiAmount(),
                store.getStoreInfo().getKujiMinPrice(),
                store.getStoreInfo().getKujiMaxPrice(),
                store.getStoreInfo().getHasSelectGacha(),
                store.getStoreInfo().getSelectGachaMinPrice(),
                store.getStoreInfo().getSelectGachaMaxPrice(),
                List.copyOf(store.getStoreInfo().getFacilities()),
                store.getStoreInfo().getHasRandomBox(),
                0L,
                store.getCreatedAt(),
                store.getUpdatedAt()
        );
    }

    public record StoreImageItem(
            Long storeImageId,
            String imageUrl
    ) {

        private static StoreImageItem from(StoreImage storeImage) {
            return new StoreImageItem(
                    storeImage.getId(),
                    storeImage.getImageUrl()
            );
        }
    }
}
