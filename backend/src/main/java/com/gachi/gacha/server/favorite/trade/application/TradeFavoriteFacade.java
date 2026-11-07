package com.gachi.gacha.server.favorite.trade.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TradeFavoriteFacade {

    private final TradeFavoriteService tradeFavoriteService;

    public void add(final Long memberId, final Long tradeId) {
        try {
            tradeFavoriteService.add(memberId, tradeId);
        } catch (DataIntegrityViolationException e) {
            if (tradeFavoriteService.isFavorite(memberId, tradeId)) {
                log.debug("trade 관심 중복 등록 요청을 무시합니다. memberId={} tradeId={}", memberId, tradeId);
                return;
            }
            throw e;
        }
    }

    public void remove(final Long memberId, final Long tradeId) {
        tradeFavoriteService.remove(memberId, tradeId);
    }
}
