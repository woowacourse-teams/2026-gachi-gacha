package com.gachi.gacha.server.member.domain.util;

import java.util.concurrent.ThreadLocalRandom;

public final class NicknameGenerator {

    private static final String PREFIX = "루챠";
    private static final int MIN_SUFFIX = 100_000;
    private static final int MAX_SUFFIX = 1_000_000;

    private NicknameGenerator() {
    }

    public static String random() {
        return PREFIX + ThreadLocalRandom.current().nextInt(MIN_SUFFIX, MAX_SUFFIX);
    }
}
