package com.gachi.gacha.server.favorite.store.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreFavoriteJpaRepository extends JpaRepository<StoreFavorite, Long> {

    boolean existsByMemberIdAndStoreId(Long memberId, Long storeId);

    Optional<StoreFavorite> findByMemberIdAndStoreId(Long memberId, Long storeId);

    @Modifying
    @Query("delete from StoreFavorite f where f.member.id = :memberId and f.store.id = :storeId")
    void deleteByMemberIdAndStoreId(@Param("memberId") Long memberId, @Param("storeId") Long storeId);
}
