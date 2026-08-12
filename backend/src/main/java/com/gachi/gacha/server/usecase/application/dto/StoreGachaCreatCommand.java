package com.gachi.gacha.server.usecase.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.domain.Store;
import lombok.Builder;

@Builder
public record StoreGachaCreatCommand(
        Store store,
        Gacha gacha
) {
    public static StoreGachaCreatCommand fromCommand(Store store, Gacha gacha) {
        return StoreGachaCreatCommand.builder()
                .store(store)
                .gacha(gacha)
                .build();
    }
}
