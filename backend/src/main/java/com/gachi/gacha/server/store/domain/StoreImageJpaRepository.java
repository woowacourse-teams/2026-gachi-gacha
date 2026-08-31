package com.gachi.gacha.server.store.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreImageJpaRepository extends JpaRepository<StoreImage, Long> {
    List<StoreImage> findAllByStoreId(final Long storeId);
}
