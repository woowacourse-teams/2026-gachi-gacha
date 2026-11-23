package com.gachi.gacha.server.favorite.gacha.application.event;

public record GachaFavoriteChangedEvent(Long memberId, Long gachaId, boolean favorite) {
}
