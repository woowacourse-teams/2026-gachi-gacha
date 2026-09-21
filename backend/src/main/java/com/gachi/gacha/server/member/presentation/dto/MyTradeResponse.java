package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.presentation.dto.TradeSummaryResponse;
import java.util.List;
import lombok.Builder;

@Builder
public record MyTradeResponse(
        int count,
        List<TradeSummaryResponse> trades
) {
    public static MyTradeResponse from(final List<TradeSummaryInfo> tradeInfos) {
        return MyTradeResponse.builder()
                .count(tradeInfos.size())
                .trades(
                        tradeInfos.stream()
                                .map(TradeSummaryResponse::from)
                                .toList()
                )
                .build();
    }
}
