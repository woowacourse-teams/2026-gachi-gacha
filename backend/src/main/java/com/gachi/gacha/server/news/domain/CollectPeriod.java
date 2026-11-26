package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * 계정 하나의 수집 기간 (UTC 날짜). 회차(news_batch.periods)에 계정마다 하나씩 저장한다.
 *
 * <p>{@code to} 는 수집을 실행한 날이고, 다음 수집은 여기서 시작한다. 그래서 경계일 하루는 다시 검색되고,
 * 다시 나온 게시물은 중복 판단에서 걸러진다.
 *
 * @param handle    X 계정 아이디
 * @param collected 그 계정의 모든 구간을 수집했는지. 하나라도 실패하면 false 이고, 다음 수집이 이 기간을 다시 가져온다
 */
public record CollectPeriod(String handle, LocalDate from, LocalDate to, boolean collected) {

    public CollectPeriod {
        Objects.requireNonNull(handle, "handle");
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("수집 기간의 시작이 끝보다 늦다: " + from + " ~ " + to);
        }
    }

    public static CollectPeriod notCollected(final String handle, final LocalDate from, final LocalDate to) {
        return new CollectPeriod(handle, from, to, false);
    }

    public CollectPeriod markCollected() {
        return new CollectPeriod(handle, from, to, true);
    }

    public int days() {
        return (int) ChronoUnit.DAYS.between(from, to);
    }
}
