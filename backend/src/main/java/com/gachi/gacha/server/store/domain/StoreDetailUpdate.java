package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.util.BaseUtils;
import java.util.List;

public record StoreDetailUpdate(
        String businessHours,
        String paymentMethods,
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

    public StoreDetailUpdate {
        facilities = BaseUtils.copyIfPresent(facilities);
    }
}
