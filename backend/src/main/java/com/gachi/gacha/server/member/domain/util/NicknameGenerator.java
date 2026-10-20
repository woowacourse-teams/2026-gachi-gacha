package com.gachi.gacha.server.member.domain.util;

import java.util.concurrent.ThreadLocalRandom;

public final class NicknameGenerator {

    private static final String PREFIX = "루챠";

    private NicknameGenerator() {
    }

    public static String random() {
        return PREFIX + ThreadLocalRandom.current().nextInt(100_000, 1_000_000);
    }
}
