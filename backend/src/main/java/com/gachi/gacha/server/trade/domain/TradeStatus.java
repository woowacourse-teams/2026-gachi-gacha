package com.gachi.gacha.server.trade.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TradeStatus {
    AVAILABLE("교환 가능"),
    IN_PROGRESS("교환 진행 중"),
    COMPLETED("교환 완료");

    private final String label;
}
