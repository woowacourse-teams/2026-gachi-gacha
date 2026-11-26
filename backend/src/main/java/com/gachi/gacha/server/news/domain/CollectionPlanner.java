package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 계정별 수집 기간을 정하고, 그 기간을 계정의 분할 일수만큼 나눠 Grok 호출 목록을 만든다.
 *
 * <p>기간: 그 계정을 마지막으로 수집에 성공한 회차의 기간 끝부터 오늘(UTC)까지. 월요일은 한국 계정만, 목요일은 한국·일본
 * 계정을 수집하므로 계정마다 다르다. 기록이 없으면 최근 {@code defaultDays} 일이고, {@code maxDays} 일을 넘으면 줄인다.
 * 날짜를 UTC 로 쓰는 이유는 xAI 의 기간 제한(from_date, to_date)이 UTC 날짜 단위이기 때문이다.
 *
 * <p>분할: 수집 스크립트와 같다. 시작일부터 분할 일수마다 자르고, 마지막 구간은 끝 날짜 없이 지금까지 검색한다.
 * 기간이 0일(오늘 이미 수집함)이어도 오늘 하루를 한 번 검색한다. 스크립트는 0일이면 호출하지 않지만,
 * 서버는 같은 날 다시 실행될 수 있어서 그 사이 게시물을 놓치지 않으려는 것이다.
 */
public class CollectionPlanner {

    private final int defaultDays;
    private final int maxDays;

    public CollectionPlanner(final int defaultDays, final int maxDays) {
        if (defaultDays < 1 || maxDays < defaultDays) {
            throw new IllegalArgumentException("기간 설정이 잘못됐다: default=" + defaultDays + ", max=" + maxDays);
        }
        this.defaultDays = defaultDays;
        this.maxDays = maxDays;
    }

    /**
     * @param recentBatches 최근 회차부터 정렬된 목록. 여기서 계정별 마지막 수집 성공 기간을 찾는다
     */
    public List<CollectPeriod> periods(
            final List<CollectTarget> targets,
            final List<NewsBatch> recentBatches,
            final LocalDate todayUtc
    ) {
        Map<String, LocalDate> lastUntil = lastCollectedUntil(recentBatches);
        LocalDate earliest = todayUtc.minusDays(maxDays);
        return targets.stream()
                .map(target -> {
                    LocalDate from = lastUntil.getOrDefault(target.handle(), todayUtc.minusDays(defaultDays));
                    if (from.isBefore(earliest)) {
                        from = earliest;
                    }
                    if (from.isAfter(todayUtc)) {
                        from = todayUtc;
                    }
                    return CollectPeriod.notCollected(target.handle(), from, todayUtc);
                })
                .toList();
    }

    /**
     * 정한 기간대로 호출 목록을 만든다.
     */
    public List<CollectCall> calls(final List<CollectTarget> targets, final List<CollectPeriod> periods) {
        Map<String, CollectPeriod> periodByHandle = new HashMap<>();
        periods.forEach(period -> periodByHandle.put(period.handle(), period));
        List<CollectCall> calls = new ArrayList<>();
        for (CollectTarget target : targets) {
            CollectPeriod period = Objects.requireNonNull(periodByHandle.get(target.handle()),
                    () -> "수집 기간이 없는 계정: " + target.handle());
            calls.addAll(split(target, period));
        }
        return calls;
    }

    /**
     * 계정마다 모든 구간을 수집한 가장 최근 기간의 끝을 찾는다. 일부 구간이 실패한 계정은 건너뛰어서
     * 다음 수집이 그 기간을 다시 포함하게 한다. [다시 수집]으로 버린 회차는 후보도 버려졌으므로 수집한 것으로 보지 않는다.
     */
    static Map<String, LocalDate> lastCollectedUntil(final List<NewsBatch> recentBatches) {
        Map<String, LocalDate> lastUntil = new HashMap<>();
        for (NewsBatch batch : recentBatches) {
            if (batch.getStatus() == NewsBatchStatus.DISCARDED) {
                continue;
            }
            batch.periods().stream()
                    .filter(CollectPeriod::collected)
                    .forEach(period -> lastUntil.putIfAbsent(period.handle(), period.to()));
        }
        return lastUntil;
    }

    private List<CollectCall> split(final CollectTarget target, final CollectPeriod period) {
        int days = period.days();
        if (days == 0) {
            return List.of(new CollectCall(target, period.from(), null));
        }
        List<CollectCall> calls = new ArrayList<>();
        for (int offset = 0; offset < days; offset += target.chunkDays()) {
            int next = offset + target.chunkDays();
            LocalDate to = next >= days ? null : period.from().plusDays(next);
            calls.add(new CollectCall(target, period.from().plusDays(offset), to));
        }
        return calls;
    }
}
