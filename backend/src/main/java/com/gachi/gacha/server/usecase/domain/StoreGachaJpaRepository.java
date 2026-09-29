package com.gachi.gacha.server.usecase.domain;

import com.gachi.gacha.server.gacha.domain.Gacha;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreGachaJpaRepository extends JpaRepository<StoreGacha, Long> {

    @Query(
            value = "select sg.gacha from StoreGacha sg where sg.store.id = :storeId",
            countQuery = "select count(sg) from StoreGacha sg where sg.store.id = :storeId"
    )
    Page<Gacha> findGachasByStoreId(final Long storeId, final Pageable pageable);

    @Query("SELECT new com.gachi.gacha.server.usecase.domain.StoreGachaCount(sg.gacha.id, COUNT(sg)) " +
            "FROM StoreGacha sg " +
            "WHERE sg.gacha.id IN :gachaIds " +
            "GROUP BY sg.gacha.id")
    List<StoreGachaCount> countByGachaIds(@Param("gachaIds") List<Long> gachaIds);
}
