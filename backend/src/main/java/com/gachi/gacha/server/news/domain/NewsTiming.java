package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.util.regex.Pattern;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;

/**
 * 오늘 날짜(KST)를 기준으로 코드가 판단하는 진행 상태. 모델은 날짜만 적고 상태는 판단하지 않는다.
 *
 * <p>판단 순서와 종료 기준은 수집 스크립트와 같다. 스크립트의 "시작됨"(시작일만 있고 지난 소식)은 진행 중으로 본다.
 */
@Getter
@RequiredArgsConstructor
public enum NewsTiming {

    UPCOMING("예정"),
    ONGOING("진행 중"),
    ENDED("종료");

    private static final Pattern ENDED_WORDS = Pattern.compile("종료|마감|終了");

    private final String label;

    /**
     * 예정 → 종료 → 진행 중 순서로 판단한다.
     * 날짜가 하나도 없으면 제목과 날짜 표기에 종료를 뜻하는 말이 있는지로 판단하고, 그것도 없으면 null 이다.
     */
    public static @Nullable NewsTiming judge(
            @Nullable final LocalDate startDate,
            @Nullable final LocalDate endDate,
            @Nullable final String title,
            @Nullable final String dateLabel,
            final LocalDate today
    ) {
        if (startDate != null && startDate.isAfter(today)) {
            return UPCOMING;
        }
        if (endDate != null && endDate.isBefore(today)) {
            return ENDED;
        }
        if (endDate != null || startDate != null) {
            return ONGOING;
        }
        String text = (title == null ? "" : title) + " " + (dateLabel == null ? "" : dateLabel);
        if (ENDED_WORDS.matcher(text).find()) {
            return ENDED;
        }
        return null;
    }
}
