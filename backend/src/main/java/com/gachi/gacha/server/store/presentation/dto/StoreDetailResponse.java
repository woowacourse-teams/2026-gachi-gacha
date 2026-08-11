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

    public static StoreDetailResponse from(StoreDetailResult result) {
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
                result.gachaMachineCount(),
                result.coinPrice(),
                result.gachaPriceMin(),
                result.gachaPriceMax(),
                result.kujiCount(),
                result.kujiPriceMin(),
                result.kujiPriceMax(),
                result.hasSelectGacha(),
                result.selectGachaPriceMin(),
                result.selectGachaPriceMax(),
                result.facilities(),
                result.hasRandomBox(),
                result.ownedGachaCount(),
                result.createdAt(),
                result.updatedAt()
        );
    }

    public record StoreImageResponse(
            Long storeImageId,
            String imageUrl
    ) {

        private static StoreImageResponse from(StoreDetailResult.StoreImageItem image) {
            return new StoreImageResponse(
                    image.storeImageId(),
                    image.imageUrl()
            );
        }
    }
}
