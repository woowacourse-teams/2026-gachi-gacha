package com.gachi.gacha.server.favorite.gacha.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GachaFavoriteFacade {

    private final GachaFavoriteService favoriteService;

    public void add(final Long memberId, final Long gachaId) {
        try {
            favoriteService.add(memberId, gachaId);
        } catch (DataIntegrityViolationException e) {
            if (favoriteService.isFavorite(memberId, gachaId)) {
                log.debug("가챠 관심 중복 등록 요청을 무시합니다. memberId={} gachaId={}", memberId, gachaId);
                return;
            }
            throw e;
        }
    }
}
