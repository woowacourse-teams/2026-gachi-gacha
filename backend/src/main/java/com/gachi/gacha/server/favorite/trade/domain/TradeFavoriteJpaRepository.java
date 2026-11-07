package com.gachi.gacha.server.favorite.trade.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeFavoriteJpaRepository extends JpaRepository<TradeFavorite, Long> {

    boolean existsByMemberIdAndTradeId(final Long memberId, final Long tradeId);

    @Modifying
    @Query("delete from TradeFavorite f where f.member.id = :memberId and f.trade.id = :tradeId")
    void deleteByMemberIdAndTradeId(@Param("memberId") final Long memberId, @Param("tradeId") final Long tradeId);

    @Query("select f.trade.id from TradeFavorite f where f.member.id = :memberId and f.trade.id in :tradeIds")
    List<Long> findFavoriteTradeIds(@Param("memberId") final Long memberId, @Param("tradeIds") final List<Long> tradeIds);

    @Query("""
            select f from TradeFavorite f
            join fetch f.trade
            where f.member.id = :memberId and f.id < :cursor
            order by f.id desc
            """)
    Slice<TradeFavorite> findSliceByMemberId(
            @Param("memberId") final Long memberId,
            @Param("cursor") final Long cursor,
            final Pageable pageable
    );

    Optional<TradeFavorite> findByMemberIdAndTradeId(final Long memberId, final Long tradeId);

    List<TradeFavorite> findByTradeId(final Long tradeId);
}
