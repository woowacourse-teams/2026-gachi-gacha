package com.gachi.gacha.server.favorite.trade.application.dto;

import com.gachi.gacha.server.favorite.trade.domain.TradeFavorite;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;

public record TradeFavoriteInfo(
        Long favoriteId,
        Long tradeId,
        String title,
        TradeStatus status,
        LocalDateTime favoriteAt
) {
    public static TradeFavoriteInfo from(final TradeFavorite favorite) {
        return new TradeFavoriteInfo(
                favorite.getId(),
                favorite.getTrade().getId(),
                favorite.getTrade().getTitle(),
                favorite.getTrade().getStatus(),
                favorite.getCreatedAt()
        );
    }

    public record Page(
            List<TradeFavoriteInfo> items,
            Long nextCursor,
            boolean hasNext
    ) {
    }
}
