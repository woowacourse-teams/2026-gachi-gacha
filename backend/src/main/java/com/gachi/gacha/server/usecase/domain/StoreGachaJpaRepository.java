package com.gachi.gacha.server.usecase.domain;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.domain.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreGachaJpaRepository extends JpaRepository<StoreGacha, Long> {

    @Query(
            value = "select sg.gacha from StoreGacha sg where sg.store.id = :storeId",
            countQuery = "select count(sg) from StoreGacha sg where sg.store.id = :storeId"
    )
    Page<Gacha> findGachasByStoreId(final Long storeId, final Pageable pageable);
    StoreGacha deleteStoreGachaByStoreAndGacha(final Store store, final Gacha gacha);
}
