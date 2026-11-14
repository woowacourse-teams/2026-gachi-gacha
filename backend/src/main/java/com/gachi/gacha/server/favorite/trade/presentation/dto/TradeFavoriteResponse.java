package com.gachi.gacha.server.favorite.trade.presentation.dto;

import com.gachi.gacha.server.favorite.trade.application.dto.TradeFavoriteInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

public record TradeFavoriteResponse(
        Long favoriteId,
        Long tradeId,
        String title,
        TradeStatus status,
        LocalDateTime favoriteAt
) {

    public static TradeFavoriteResponse from(final TradeFavoriteInfo favorite) {
        return new TradeFavoriteResponse(
                favorite.favoriteId(),
                favorite.tradeId(),
                favorite.title(),
                favorite.status(),
                favorite.favoriteAt()
        );
    }

    /** nextCursor: 다음 요청의 cursor로 그대로 넘기는 값 (마지막 favoriteId). */
    @Builder
    public record Page(
            List<TradeFavoriteResponse> items,
            Long nextCursor,
            boolean hasNext
    ) {
        public static Page from(final TradeFavoriteInfo.Page info) {
            return Page.builder()
                    .items(info.items().stream().map(TradeFavoriteResponse::from).toList())
                    .nextCursor(info.nextCursor())
                    .hasNext(info.hasNext())
                    .build();
        }
    }
}
