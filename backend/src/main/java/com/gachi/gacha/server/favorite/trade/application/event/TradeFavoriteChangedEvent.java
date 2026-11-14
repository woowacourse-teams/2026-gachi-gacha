package com.gachi.gacha.server.favorite.trade.application.event;

public record TradeFavoriteChangedEvent(
        Long memberId,
        Long tradeId,
        boolean favorite
) {
}
