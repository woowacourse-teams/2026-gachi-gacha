package com.gachi.gacha.server.favorite.gacha.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GachaFavoriteJpaRepository extends JpaRepository<GachaFavorite, Long> {

    boolean existsByMemberIdAndGachaId(Long memberId, Long gachaId);

    Optional<GachaFavorite> findByMemberIdAndGachaId(Long memberId, Long gachaId);

    @Modifying
    @Query("delete from GachaFavorite f where f.member.id = :memberId and f.gacha.id = :gachaId")
    void deleteByMemberIdAndGachaId(@Param("memberId") Long memberId, @Param("gachaId") Long gachaId);
}
