package com.gachi.gacha.server.favorite.store.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StoreFavoriteFacade {

    private final StoreFavoriteService favoriteService;

    public void add(final Long memberId, final Long storeId) {
        try {
            favoriteService.add(memberId, storeId);
        } catch (DataIntegrityViolationException e) {
            if (favoriteService.isFavorite(memberId, storeId)) {
                log.debug("매장 관심 중복 등록 요청을 무시합니다. memberId={} storeId={}", memberId, storeId);
                return;
            }
            throw e;
        }
    }
}
