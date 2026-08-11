package com.gachi.gacha.server.store.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreJpaRepository extends JpaRepository<Store, Long> {

    @Override
    @EntityGraph(attributePaths = "storeInfo")
    Page<Store> findAll(Pageable pageable);
}
