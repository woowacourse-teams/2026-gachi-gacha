package com.gachi.gacha.server.collection.application;

import java.util.Arrays;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GachaKeyword {

    RESTOCK("입고"),
    NEW_ARRIVAL("신상"),
    BACK_IN_STOCK("재입고");

    private final String keyword;

    public static boolean isIncludedIn(final String caption) {
        return Arrays.stream(values())
                .anyMatch(gachaKeyword -> caption.contains(gachaKeyword.keyword));
    }
}
