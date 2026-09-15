package com.gachi.gacha.server.trade.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeImageJpaRepository extends JpaRepository<TradeImage, Long> {
    List<TradeImage> findAllByTradeId(final Long tradeId);
}
