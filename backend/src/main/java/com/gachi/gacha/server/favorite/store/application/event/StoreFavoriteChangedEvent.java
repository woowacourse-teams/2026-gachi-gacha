package com.gachi.gacha.server.favorite.store.application.event;

public record StoreFavoriteChangedEvent(Long memberId, Long storeId, boolean favorite) {
}
