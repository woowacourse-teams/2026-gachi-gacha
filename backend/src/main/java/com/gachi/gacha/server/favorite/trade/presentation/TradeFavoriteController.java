package com.gachi.gacha.server.favorite.trade.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.favorite.trade.application.TradeFavoriteFacade;
import com.gachi.gacha.server.favorite.trade.application.TradeFavoriteService;
import com.gachi.gacha.server.favorite.trade.application.dto.TradeFavoriteInfo;
import com.gachi.gacha.server.favorite.trade.presentation.dto.TradeFavoriteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TradeFavoriteController {

    private final TradeFavoriteFacade tradeFavoriteFacade;
    private final TradeFavoriteService tradeFavoriteService;

    @PutMapping("/trades/{tradeId}/favorite")
    public ResponseEntity<Void> add(
            @Auth final Long memberId,
            @PathVariable final Long tradeId
    ) {
        tradeFavoriteFacade.add(memberId, tradeId);
        return BaseResponse.noContent();
    }

    @DeleteMapping("/trades/{tradeId}/favorite")
    public ResponseEntity<Void> remove(
            @Auth final Long memberId,
            @PathVariable final Long tradeId
    ) {
        tradeFavoriteFacade.remove(memberId, tradeId);
        return BaseResponse.noContent();
    }

    @GetMapping("/members/me/favorites/trades")
    public BaseResponse<TradeFavoriteResponse.Page> findMyFavorites(
            @Auth final Long memberId,
            @RequestParam(required = false) final Long cursor,
            @RequestParam(defaultValue = "20") final int size
    ) {
        TradeFavoriteInfo.Page favorites = tradeFavoriteService.findMyFavorites(memberId, cursor, size);
        return BaseResponse.ok(TradeFavoriteResponse.Page.from(favorites));
    }
}
