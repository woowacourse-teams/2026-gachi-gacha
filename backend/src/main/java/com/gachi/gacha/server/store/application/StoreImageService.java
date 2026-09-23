package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.store.application.dto.StoreImageInfo;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreImageJpaRepository;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreImageService {

    private final StoreJpaRepository storeRepository;
    private final StoreImageJpaRepository storeImageRepository;

    public List<StoreImageInfo> findImages(final Long storeId) {
        Store store = storeRepository.getById(storeId);

        return storeImageRepository.findAllByStoreId(store.getId()).stream()
                .map(StoreImageInfo::from)
                .toList();
    }
}
