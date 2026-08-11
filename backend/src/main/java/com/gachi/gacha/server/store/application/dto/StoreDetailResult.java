package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreImage;
import java.time.LocalDateTime;
import java.util.List;

public record StoreDetailResult(
        Long storeId,
        String name,
        String thumbnailUrl,
        List<StoreImageInfo> images,
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

    public static StoreDetailResult from(final Store store) {
        List<StoreImageInfo> images = store.getStoreImages().stream()
                .map(StoreImageInfo::from)
                .toList();

        return new StoreDetailResult(
                store.getId(),
                store.getStoreDetail().getName(),
                store.getThumbnailUrl(),
                images,
                store.getLatitude(),
                store.getLongitude(),
                store.getStoreDetail().getPhone(),
                store.getStoreDetail().getInstagramId(),
                store.getStoreDetail().getAddress(),
                store.getStoreDetail().getBusinessHours(),
                List.copyOf(store.getStoreDetail().getPaymentMethods()),
                store.getStoreDetail().getMachineAmount(),
                store.getStoreDetail().getCoinPrice(),
                store.getStoreDetail().getGachaMinPrice(),
                store.getStoreDetail().getGachaMaxPrice(),
                store.getStoreDetail().getKujiAmount(),
                store.getStoreDetail().getKujiMinPrice(),
                store.getStoreDetail().getKujiMaxPrice(),
                store.getStoreDetail().getHasSelectGacha(),
                store.getStoreDetail().getSelectGachaMinPrice(),
                store.getStoreDetail().getSelectGachaMaxPrice(),
                List.copyOf(store.getStoreDetail().getFacilities()),
                store.getStoreDetail().getHasRandomBox(),
                0L,
                store.getCreatedAt(),
                store.getAggregateUpdatedAt()
        );
    }

    public record StoreImageInfo(
            Long storeImageId,
            String imageUrl
    ) {

        private static StoreImageInfo from(final StoreImage storeImage) {
            return new StoreImageInfo(
                    storeImage.getId(),
                    storeImage.getImageUrl()
            );
        }
    }
}
