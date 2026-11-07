package com.gachi.gacha.server.favorite.signal.application.event;

import com.gachi.gacha.server.favorite.signal.application.FavoriteSignalService;
import com.gachi.gacha.server.favorite.trade.application.event.TradeFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.gacha.application.event.GachaFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.store.application.event.StoreFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteType;
import com.gachi.gacha.server.trade.application.event.TradeInferenceCompletedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class FavoriteSignalEventListener {

    private final FavoriteSignalService favoriteSignalService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleTradeFavoriteChangedEvent(final TradeFavoriteChangedEvent event) {
        if (event.favorite()) {
            favoriteSignalService.rebuildForTradeFavorite(event.memberId(), event.tradeId());
            return;
        }
        favoriteSignalService.removeForTradeFavorite(event.memberId(), event.tradeId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleGachaFavoriteChangedEvent(final GachaFavoriteChangedEvent event) {
        if (!event.favorite()) {
            favoriteSignalService.removeSignalsForTarget(event.memberId(), FavoriteType.GACHA, event.gachaId());
            return;
        }
        favoriteSignalService.rebuildForGachaFavorite(event.memberId(), event.gachaId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleStoreFavoriteChangedEvent(final StoreFavoriteChangedEvent event) {
        if (!event.favorite()) {
            favoriteSignalService.removeSignalsForTarget(event.memberId(), FavoriteType.STORE, event.storeId());
            return;
        }
        favoriteSignalService.rebuildForStoreFavorite(event.memberId(), event.storeId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleTradeInferenceCompletedEvent(final TradeInferenceCompletedEvent event) {
        favoriteSignalService.rebuildForTrade(event.tradeId());
    }
}
