package com.gachi.gacha.server.favorite.store.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreFavoriteJpaRepository extends JpaRepository<StoreFavorite, Long> {

    boolean existsByMemberIdAndStoreId(final Long memberId, final Long storeId);

    Optional<StoreFavorite> findByMemberIdAndStoreId(final Long memberId, final Long storeId);

    @Modifying
    @Query("delete from StoreFavorite f where f.member.id = :memberId and f.store.id = :storeId")
    void deleteByMemberIdAndStoreId(@Param("memberId") final Long memberId, @Param("storeId") final Long storeId);
}
