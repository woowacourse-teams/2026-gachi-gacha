package com.gachi.gacha.server.trade.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeImageJpaRepository extends JpaRepository<TradeImage, Long> {

    List<TradeImage> findAllByTradeIdOrderByIdAsc(final Long tradeId);

    List<TradeImage> findAllByTradeIdInOrderByIdAsc(final List<Long> tradeIds);

    @Query("""
        select ti from TradeImage ti
        where ti.id in (
            select min(sub.id) from TradeImage sub
            where sub.trade.id in :tradeIds
            group by sub.trade.id
        )
        """)
    List<TradeImage> findFirstImagesByTradeIdIn(@Param("tradeIds") List<Long> tradeIds);
}
