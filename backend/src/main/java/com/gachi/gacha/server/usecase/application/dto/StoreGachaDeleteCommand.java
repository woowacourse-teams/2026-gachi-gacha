package com.gachi.gacha.server.usecase.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.domain.Store;
import lombok.Builder;

@Builder
public record StoreGachaDeleteCommand(
        Store store,
        Gacha gacha
) {
    public static StoreGachaDeleteCommand fromCommand(final Store store, final Gacha gacha) {
        return StoreGachaDeleteCommand.builder()
                .store(store)
                .gacha(gacha)
                .build();
    }
}
