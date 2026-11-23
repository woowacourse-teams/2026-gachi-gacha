package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class NewsTimingTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 9);

    @ParameterizedTest(name = "시작 {0}, 종료 {1} → {2}")
    @CsvSource(nullValues = "null", value = {
            "2026-11-10, null,       UPCOMING",
            "2026-11-10, 2026-11-01, UPCOMING",
            "null,       2026-11-08, ENDED",
            "2026-11-01, 2026-11-08, ENDED",
            "null,       2026-11-09, ONGOING",
            "2026-11-05, 2026-11-15, ONGOING",
            "2026-11-09, 2026-11-09, ONGOING",
            "2026-11-09, null,       ONGOING",
            "2026-11-01, null,       ONGOING"
    })
    @DisplayName("날짜가 있으면 예정 → 종료 → 진행 중 순서로 판단하고, 시작일만 지났으면 진행 중이다")
    void judgesByDates(final LocalDate start, final LocalDate end, final NewsTiming expected) {
        assertThat(NewsTiming.judge(start, end, "제목", null, TODAY)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource(nullValues = "null", value = {
            "시사다라케 쿠지 종료 안내, null",
            "프리즌 포테토, 11/3 판매 마감",
            "受注終了のお知らせ, null"
    })
    @DisplayName("날짜가 없으면 제목·날짜 표기에 종료·마감·終了 가 있을 때만 종료다")
    void judgesEndedByWordsWithoutDates(final String title, final String dateLabel) {
        assertThat(NewsTiming.judge(null, null, title, dateLabel, TODAY)).isEqualTo(NewsTiming.ENDED);
    }

    @Test
    @DisplayName("날짜도 종료를 뜻하는 말도 없으면 판단하지 않는다")
    void nullWhenUnknown() {
        assertThat(NewsTiming.judge(null, null, "11월 하순 순차 발매", "11월 하순", TODAY)).isNull();
        assertThat(NewsTiming.judge(null, null, null, null, TODAY)).isNull();
    }

    @Test
    @DisplayName("날짜가 있으면 제목의 종료라는 말보다 날짜를 우선한다")
    void datesWinOverWords() {
        assertThat(NewsTiming.judge(LocalDate.of(2026, 11, 12), null, "예약 종료 후 판매", null, TODAY))
                .isEqualTo(NewsTiming.UPCOMING);
    }
}
