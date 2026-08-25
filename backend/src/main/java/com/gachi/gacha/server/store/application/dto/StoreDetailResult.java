package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;
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
        Integer floor,
        String unit,
        String businessHours,
        String paymentMethods,
        Integer gachaMachineAmount,
        Long coinPrice,
        Long gachaPriceMin,
        Long gachaPriceMax,
        Integer kujiAmount,
        Long kujiPriceMin,
        Long kujiPriceMax,
        Boolean hasSelectGacha,
        Long selectGachaPriceMin,
        Long selectGachaPriceMax,
        List<String> facilities,
        Boolean hasRandomBox,
        long ownedGachaAmount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static StoreDetailResult of(
            final Store store,
            final StoreDetail storeDetail,
            final List<StoreImage> storeImages
    ) {
        List<StoreImageInfo> images = storeImages.stream()
                .map(StoreImageInfo::from)
                .toList();

        return new StoreDetailResult(
                store.getId(),
                store.getName(),
                store.getThumbnailUrl(),
                images,
                store.getLatitude(),
                store.getLongitude(),
                storeDetail.getPhone(),
                storeDetail.getInstagramId(),
                store.getAddress(),
                store.getFloor(),
                store.getUnit(),
                storeDetail.getBusinessHours(),
                storeDetail.getPaymentMethods(),
                storeDetail.getMachineAmount(),
                storeDetail.getCoinPrice(),
                storeDetail.getGachaMinPrice(),
                storeDetail.getGachaMaxPrice(),
                storeDetail.getKujiAmount(),
                storeDetail.getKujiMinPrice(),
                storeDetail.getKujiMaxPrice(),
                storeDetail.getHasSelectGacha(),
                storeDetail.getSelectGachaMinPrice(),
                storeDetail.getSelectGachaMaxPrice(),
                List.copyOf(storeDetail.getFacilities()),
                storeDetail.getHasRandomBox(),
                0L,
                store.getCreatedAt(),
                getUpdatedAt(store, storeDetail)
        );
    }

    private static LocalDateTime getUpdatedAt(final Store store, final StoreDetail storeDetail) {
        LocalDateTime storeUpdatedAt = store.getUpdatedAt();
        LocalDateTime detailUpdatedAt = storeDetail.getUpdatedAt();

        if (storeUpdatedAt == null) {
            return detailUpdatedAt;
        }
        if (detailUpdatedAt == null || storeUpdatedAt.isAfter(detailUpdatedAt)) {
            return storeUpdatedAt;
        }
        return detailUpdatedAt;
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
