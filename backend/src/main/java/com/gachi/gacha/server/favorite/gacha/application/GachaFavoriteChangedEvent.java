package com.gachi.gacha.server.favorite.gacha.application;

public record GachaFavoriteChangedEvent(Long memberId, Long gachaId, boolean favorite) {
}
