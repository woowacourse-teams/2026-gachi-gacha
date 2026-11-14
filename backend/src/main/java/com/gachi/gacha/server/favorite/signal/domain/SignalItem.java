package com.gachi.gacha.server.favorite.signal.domain;

public record SignalItem(
        SignalType type,
        String value,
        double weight
) {
}
