package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import java.time.LocalDateTime;
import java.util.List;

public record StoreDetailResponse(
        Long storeId,
        String name,
        String thumbnailUrl,
        List<StoreImageResponse> images,
        Double latitude,
        Double longitude,
        String phoneNumber,
        String instagramId,
        String address,
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

    public static StoreDetailResponse from(final StoreDetailResult result) {
        List<StoreImageResponse> images = result.images().stream()
                .map(StoreImageResponse::from)
                .toList();

        return new StoreDetailResponse(
                result.storeId(),
                result.name(),
                result.thumbnailUrl(),
                images,
                result.latitude(),
                result.longitude(),
                result.phoneNumber(),
                result.instagramId(),
                result.address(),
                result.businessHours(),
                result.paymentMethods(),
                result.gachaMachineAmount(),
                result.coinPrice(),
                result.gachaPriceMin(),
                result.gachaPriceMax(),
                result.kujiAmount(),
                result.kujiPriceMin(),
                result.kujiPriceMax(),
                result.hasSelectGacha(),
                result.selectGachaPriceMin(),
                result.selectGachaPriceMax(),
                result.facilities(),
                result.hasRandomBox(),
                result.ownedGachaAmount(),
                result.createdAt(),
                result.updatedAt()
        );
    }

    public record StoreImageResponse(
            Long storeImageId,
            String imageUrl
    ) {

        private static StoreImageResponse from(final StoreDetailResult.StoreImageInfo image) {
            return new StoreImageResponse(
                    image.storeImageId(),
                    image.imageUrl()
            );
        }
    }
}
