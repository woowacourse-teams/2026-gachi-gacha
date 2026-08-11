package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.store.application.dto.StoreCreateCommand;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    @Transactional(readOnly = true)
    public StoreListResult findAllStores(int page, int size) {
        validatePageRequest(page, size);

        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "id")
        );
        Page<Store> stores = storeJpaRepository.findAll(pageRequest);

        return StoreListResult.from(stores);
    }

    private void validatePageRequest(int page, int size) {
        if (page < 0 || size <= 0) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }
}
