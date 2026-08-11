package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.store.application.dto.StoreCreateCommand;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreService {
    private final StoreJpaRepository storeJpaRepository;

    @Transactional
    public StoreCreateResult addStore(StoreCreateCommand command) {
        Store store = command.toEntity();
        Store savedStore = storeJpaRepository.save(store);
        return StoreCreateResult.from(savedStore);
    }

}
