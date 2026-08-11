package com.gachi.gacha.server.store.domain;

import java.util.List;

public record StoreInfoUpdate(
        String name,
        String address,
        String businessHours,
        List<String> paymentMethods,
        String phone,
        List<String> facilities,
        String instagramId,
        Integer machineAmount,
        Integer kujiAmount,
        Long coinPrice,
        Long gachaMinPrice,
        Long gachaMaxPrice,
        Long kujiMinPrice,
        Long kujiMaxPrice,
        Long selectGachaMinPrice,
        Long selectGachaMaxPrice,
        Boolean hasRandomBox,
        Boolean hasSelectGacha
) {

    public StoreInfoUpdate {
        paymentMethods = copyIfPresent(paymentMethods);
        facilities = copyIfPresent(facilities);
    }

    private static <T> List<T> copyIfPresent(List<T> values) {
        if (values == null) {
            return null;
        }
        return List.copyOf(values);
    }
}
