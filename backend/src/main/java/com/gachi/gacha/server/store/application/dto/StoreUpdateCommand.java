package com.gachi.gacha.server.store.application.dto;

import static com.gachi.gacha.server.common.util.BaseUtils.copyIfPresent;

import java.util.List;

public record StoreUpdateCommand(
        String name,
        String thumbnailUrl,
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
        Boolean hasRandomBox
) {

    public StoreUpdateCommand {
        facilities = copyIfPresent(facilities);
    }
}
