package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.store.application.dto.StoreCreateCommand;
import com.gachi.gacha.server.store.application.dto.StoreData;
import com.gachi.gacha.server.store.application.dto.StoreInfoData;
import com.gachi.gacha.server.store.application.dto.StoreListData;
import com.gachi.gacha.server.store.application.dto.StoreUpdateCommand;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreInfoUpdate;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
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

    @Transactional(readOnly = true)
    public StoreListData findAllStore(int page, int size) {
        validatePageRequest(page, size);

        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "id")
        );
        Page<Store> stores = storeJpaRepository.findAll(pageRequest);

        return StoreListData.from(stores);
    }

    private void validatePageRequest(int page, int size) {
        if (page < 0 || size <= 0) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    @Transactional(readOnly = true)
    public StoreInfoData getStore(Long storeId) {
        Store store = storeJpaRepository.findById(storeId)
                .orElseThrow(StoreNotFoundException::new);

        return StoreInfoData.from(store);
    }

    @Transactional
    public StoreData addStore(StoreCreateCommand command) {
        Store store = command.toEntity();
        Store savedStore = storeJpaRepository.save(store);
        return StoreData.from(savedStore);
    }

    @Transactional
    public StoreData modifyStore(Long storeId, StoreUpdateCommand command) {
        Store store = storeJpaRepository.findById(storeId)
                .orElseThrow(StoreNotFoundException::new);

        store.modify(
                command.thumbnailUrl(),
                command.latitude(),
                command.longitude()
        );
        store.getStoreInfo().modify(createStoreInfoUpdate(command));
        storeJpaRepository.flush();

        return StoreData.from(store);
    }

    private StoreInfoUpdate createStoreInfoUpdate(StoreUpdateCommand command) {
        return new StoreInfoUpdate(
                command.name(),
                command.address(),
                command.businessHours(),
                command.paymentMethods(),
                command.phoneNumber(),
                command.facilities(),
                command.instagramId(),
                command.gachaMachineCount(),
                command.kujiCount(),
                command.coinPrice(),
                command.gachaPriceMin(),
                command.gachaPriceMax(),
                command.kujiPriceMin(),
                command.kujiPriceMax(),
                command.selectGachaPriceMin(),
                command.selectGachaPriceMax(),
                command.hasRandomBox(),
                command.hasSelectGacha()
        );
    }

    @Transactional
    public Long removeStore(Long storeId) {
        Store store = storeJpaRepository.findById(storeId)
                .orElseThrow(StoreNotFoundException::new);

        storeJpaRepository.delete(store);

        return storeId;
    }
}
