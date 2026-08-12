package com.gachi.gacha.server.common.util;

import java.util.List;

public final class BaseUtils {

    private BaseUtils() {
    }

    public static <T> List<T> copyIfPresent(final List<T> values) {
        if (values == null) {
            return null;
        }
        return List.copyOf(values);
    }

    public static <T> List<T> copyOrEmpty(final List<T> values) {
        if (values == null) {
            return List.of();
        }
        return List.copyOf(values);
    }

    public static <T> T valueOrCurrent(final T value, final T current) {
        return value == null ? current : value;
    }
}
