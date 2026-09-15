package com.gachi.gacha.server.trade.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.trade.domain.exception.TradeNotFoundException;
import java.util.List;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeJpaRepository extends JpaRepository<Trade, Long> {

    default Trade getById(@NonNull final Long tradeId) {
        return findById(tradeId).orElseThrow(() -> new TradeNotFoundException(ErrorCode.TRADE_NOT_FOUND));
    }

    List<Trade> findAllByMemberId(final Long memberId);
}
