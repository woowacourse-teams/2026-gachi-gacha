package com.gachi.gacha.server.usecase;

import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.application.dto.StoreGachaInfo;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.usecase.application.StoreGachaService;
import com.gachi.gacha.server.usecase.application.dto.GachaSummaryInfo;
import com.gachi.gacha.server.usecase.application.dto.StoreGachaCreatCommand;
import com.gachi.gacha.server.usecase.application.dto.StoreGachaDeleteCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StoreGachaFacade {

    private final StoreGachaService storeGachaService;
    private final GachaService gachaService;
    private final StoreService storeService;

    public StoreGachaInfo addStoreGacha(final Long storeId, final Long gachaId) {
        Store store = storeService.findByStoreId(storeId);
        Gacha gacha = gachaService.findByGachaId(gachaId);
        return storeGachaService.addStoreGacha(StoreGachaCreatCommand.fromCommand(store, gacha));
    }

    public Page<GachaSummaryInfo> getGachas(final Long storeId, final Pageable pageable) {
        return storeGachaService.findGachasByStoreId(storeId, pageable);
    }

    public StoreGachaInfo removeStoreGacha(final Long storeId, final Long gachaId) {
        Store store = storeService.findByStoreId(storeId);
        Gacha gacha = gachaService.findByGachaId(gachaId);
        return storeGachaService.removeStoreGacha(StoreGachaDeleteCommand.fromCommand(store, gacha));
    }
}
