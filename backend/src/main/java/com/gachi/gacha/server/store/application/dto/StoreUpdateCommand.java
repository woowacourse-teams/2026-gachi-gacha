package com.gachi.gacha.server.store.application.dto;

import java.util.List;

public record StoreUpdateCommand(
        String name,
        String thumbnailUrl,
        Double latitude,
        Double longitude,
        String phoneNumber,
        String instagramId,
        String address,
        String businessHours,
        List<String> paymentMethods,
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
        paymentMethods = copyIfPresent(paymentMethods);
        facilities = copyIfPresent(facilities);
    }

    private static <T> List<T> copyIfPresent(final List<T> values) {
        if (values == null) {
            return null;
        }
        return List.copyOf(values);
    }
}
