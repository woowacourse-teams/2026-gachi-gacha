package com.gachi.gacha.server.store.application.dto;

import static com.gachi.gacha.server.common.util.BaseUtils.copyOrEmpty;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;
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
        Boolean hasRandomBox
) {

    public StoreCreateCommand {
        facilities = copyOrEmpty(facilities);
    }

    public Store toStore() {
        return Store.builder()
                .thumbnailUrl(thumbnailUrl)
                .longitude(longitude)
                .latitude(latitude)
                .build();
    }

    public StoreDetail toStoreDetail(final Store store) {
        return StoreDetail.builder()
                .store(store)
                .name(name)
                .address(address)
                .businessHours(businessHours)
                .paymentMethods(paymentMethods)
                .phone(phoneNumber)
                .facilities(new ArrayList<>(facilities))
                .instagramId(instagramId)
                .machineAmount(gachaMachineAmount)
                .kujiAmount(kujiAmount)
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

}
