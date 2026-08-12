package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreDetailJpaRepository extends JpaRepository<StoreDetail, Long> {

    default StoreDetail getByStoreId(@NonNull final Long storeId) {
        return findById(storeId).orElseThrow(() -> new StoreNotFoundException(ErrorCode.STORE_NOT_FOUND));
    }
}
