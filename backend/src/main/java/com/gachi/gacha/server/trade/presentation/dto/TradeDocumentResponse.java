package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeDocument;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;

public record TradeDocumentResponse(
        Long tradeId,
        Long memberId,
        String title,
        TradeStatus status,
        List<Long> categoryIds,
        List<String> categories,
        String thumbnailUrl,
        String description,
        boolean favorite,
        LocalDateTime createdAt
) {
    public static TradeDocumentResponse of(final TradeDocument document, final boolean favorite) {
        return new TradeDocumentResponse(
                document.tradeId(),
                document.memberId(),
                document.title(),
                document.status(),
                document.categoryIds(),
                document.categories(),
                document.thumbnailUrl(),
                document.description(),
                favorite,
                document.createdAt()
        );
    }
}
