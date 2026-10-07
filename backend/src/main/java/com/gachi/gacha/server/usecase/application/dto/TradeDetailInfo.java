package com.gachi.gacha.server.usecase.application.dto;

import com.gachi.gacha.server.trade.application.dto.TradeInfo;

public record TradeDetailInfo(
        TradeInfo trade,
        long commentCount
) {
}
