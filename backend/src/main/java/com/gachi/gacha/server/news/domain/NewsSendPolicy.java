package com.gachi.gacha.server.news.domain;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

/**
 * 푸시를 보낼 수 있는 시각의 규칙. 허용 시간(기본 08:00~21:00)과 발송 상한(하루·주)을 지키는 가장 이른 시각을 고른다.
 *
 * <p>승인할 때 발송 예정 시각을 정하고 목록 공개 시각도 같은 값으로 둔다. 그래서 상한 때문에 미루는 판단도 승인할 때 끝낸다.
 * 스케줄러는 1분마다 도니, 허용 시간이 끝나기 직전에 정한 시각이 다음 순회에서 시간 밖이 되지 않도록
 * 끝나기 {@link #END_MARGIN} 전까지만 그 날의 발송 시각으로 쓴다.
 */
public class NewsSendPolicy {

    static final Duration END_MARGIN = Duration.ofMinutes(5);
    private static final int MAX_LOOKAHEAD_DAYS = 90;

    private final ZoneId zone;
    private final LocalTime windowStart;
    private final LocalTime windowEnd;
    private final int dailyLimit;
    private final int weeklyLimit;

    public NewsSendPolicy(
            final ZoneId zone,
            final LocalTime windowStart,
            final LocalTime windowEnd,
            final int dailyLimit,
            final int weeklyLimit
    ) {
        if (!windowStart.isBefore(windowEnd.minus(END_MARGIN)) || dailyLimit < 1 || weeklyLimit < 1) {
            throw new IllegalArgumentException("발송 설정이 잘못됐다: " + windowStart + "~" + windowEnd
                    + ", 하루 " + dailyLimit + ", 주 " + weeklyLimit);
        }
        this.zone = zone;
        this.windowStart = windowStart;
        this.windowEnd = windowEnd;
        this.dailyLimit = dailyLimit;
        this.weeklyLimit = weeklyLimit;
    }

    /**
     * 지금 이후에 보낼 수 있는 가장 이른 시각. 허용 시간 안이고 상한이 남은 날이어야 한다.
     * 허용 시간 안이면 지금, 밖이면 다음 시작 시각이다.
     *
     * @param scheduled 이미 정해진 다른 회차들의 발송 예정 시각. 하루·주 상한을 셀 때 쓴다
     */
    public Instant nextSendAt(final Instant now, final List<Instant> scheduled) {
        var nowInZone = now.atZone(zone);
        LocalDate date = nowInZone.toLocalDate();
        LocalTime lastStart = windowEnd.minus(END_MARGIN);
        for (int day = 0; day < MAX_LOOKAHEAD_DAYS; day++, date = date.plusDays(1)) {
            if (countOn(scheduled, date) >= dailyLimit || countInWeekOf(scheduled, date) >= weeklyLimit) {
                continue;
            }
            LocalTime start = day == 0 && nowInZone.toLocalTime().isAfter(windowStart)
                    ? nowInZone.toLocalTime() : windowStart;
            if (start.isAfter(lastStart)) {
                continue;
            }
            return date.atTime(start).atZone(zone).toInstant();
        }
        throw new IllegalStateException("발송 가능한 시각을 찾지 못했다: " + now);
    }

    /**
     * 허용 시간 안인지. 시작 시각은 포함하고 끝나는 시각은 포함하지 않는다.
     */
    public boolean isWithinWindow(final Instant at) {
        LocalTime time = at.atZone(zone).toLocalTime();
        return !time.isBefore(windowStart) && time.isBefore(windowEnd);
    }

    private long countOn(final List<Instant> scheduled, final LocalDate date) {
        return scheduled.stream().filter(at -> at.atZone(zone).toLocalDate().equals(date)).count();
    }

    private long countInWeekOf(final List<Instant> scheduled, final LocalDate date) {
        LocalDate monday = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return scheduled.stream()
                .map(at -> at.atZone(zone).toLocalDate())
                .filter(day -> !day.isBefore(monday) && day.isBefore(monday.plusWeeks(1)))
                .count();
    }
}
