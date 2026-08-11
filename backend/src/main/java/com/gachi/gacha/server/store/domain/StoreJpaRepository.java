package com.gachi.gacha.server.store.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreJpaRepository extends JpaRepository<Store, Long> {

    List<Store> findAllByLatitudeBetween(Double minLatitude, Double maxLatitude);

    @Override
    @EntityGraph(attributePaths = "storeDetail")
    Page<Store> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"storeDetail", "storeImages"})
    Optional<Store> findById(Long id);
}
