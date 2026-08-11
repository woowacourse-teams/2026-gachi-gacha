package com.gachi.gacha.server.store.application.dto;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreInfo;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;

@Builder
public record StoreCreateCommand(
        String name,
        String thumbnailUrl,
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
        List<String> imageUrls
) {

    public StoreCreateCommand {
        paymentMethods = copyOrEmpty(paymentMethods);
        facilities = copyOrEmpty(facilities);
        imageUrls = copyOrEmpty(imageUrls);
    }

    public Store toEntity() {
        Store store = Store.builder()
                .thumbnailUrl(thumbnailUrl)
                .longitude(longitude)
                .latitude(latitude)
                .build();

        store.registerInfo(createStoreInfo());
        imageUrls.forEach(store::addStoreImage);

        return store;
    }

    private StoreInfo createStoreInfo() {
        return StoreInfo.builder()
                .name(name)
                .address(address)
                .businessHours(businessHours)
                .paymentMethods(new ArrayList<>(paymentMethods))
                .phone(phoneNumber)
                .facilities(new ArrayList<>(facilities))
                .instagramId(instagramId)
                .machineAmount(gachaMachineCount)
                .kujiAmount(kujiCount)
                .coinPrice(coinPrice)
                .gachaMinPrice(gachaPriceMin)
                .gachaMaxPrice(gachaPriceMax)
                .kujiMinPrice(kujiPriceMin)
                .kujiMaxPrice(kujiPriceMax)
                .selectGachaMinPrice(selectGachaPriceMin)
                .selectGachaMaxPrice(selectGachaPriceMax)
                .hasRandomBox(hasRandomBox)
                .hasSelectGacha(hasSelectGacha)
                .build();
    }

    private static <T> List<T> copyOrEmpty(List<T> values) {
        if (values == null) {
            return List.of();
        }
        return List.copyOf(values);
    }
}
