package com.gachi.gacha.server.favorite.store.application;

public record StoreFavoriteChangedEvent(Long memberId, Long storeId, boolean favorite) {
}
