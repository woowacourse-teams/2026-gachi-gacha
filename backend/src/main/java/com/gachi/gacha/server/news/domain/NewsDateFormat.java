package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 푸시와 슬랙에 쓰는 짧은 한국어 날짜 표기. 예: 11/5(목), 11/10(화) 08:00
 */
public final class NewsDateFormat {

    private static final String DAYS_OF_WEEK = "월화수목금토일";
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private NewsDateFormat() {
    }

    public static String shortDate(final LocalDate date) {
        char dayOfWeek = DAYS_OF_WEEK.charAt(date.getDayOfWeek().getValue() - 1);
        return date.getMonthValue() + "/" + date.getDayOfMonth() + "(" + dayOfWeek + ")";
    }

    /**
     * 요일 없이 월/일만. 예: 11/30
     */
    public static String monthDay(final LocalDate date) {
        return date.getMonthValue() + "/" + date.getDayOfMonth();
    }

    public static String shortDateTime(final LocalDateTime dateTime) {
        return shortDate(dateTime.toLocalDate()) + " " + TIME.format(dateTime);
    }
}
