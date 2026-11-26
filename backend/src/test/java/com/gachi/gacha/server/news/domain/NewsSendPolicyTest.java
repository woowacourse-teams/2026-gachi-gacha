package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class NewsSendPolicyTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    // 2026-11-25 은 수요일이다
    private final NewsSendPolicy policy = new NewsSendPolicy(KST, LocalTime.of(8, 0), LocalTime.of(21, 0), 1, 3);

    @Nested
    @DisplayName("다음 발송 시각")
    class NextSendAt {

        @Test
        @DisplayName("허용 시간 안이면 지금, 밖이면 다음 08:00 이다")
        void withinWindowNowOtherwiseNextStart() {
            assertThat(policy.nextSendAt(kst("2026-11-25T10:00"), List.of())).isEqualTo(kst("2026-11-25T10:00"));
            assertThat(policy.nextSendAt(kst("2026-11-25T07:59"), List.of())).isEqualTo(kst("2026-11-25T08:00"));
            assertThat(policy.nextSendAt(kst("2026-11-25T08:00"), List.of())).isEqualTo(kst("2026-11-25T08:00"));
            assertThat(policy.nextSendAt(kst("2026-11-25T21:00"), List.of())).isEqualTo(kst("2026-11-26T08:00"));
            assertThat(policy.nextSendAt(kst("2026-11-25T23:30"), List.of())).isEqualTo(kst("2026-11-26T08:00"));
            assertThat(policy.nextSendAt(kst("2026-11-25T03:00"), List.of())).isEqualTo(kst("2026-11-25T08:00"));
        }

        @Test
        @DisplayName("스케줄러가 1분마다 도므로 허용 시간이 끝나기 5분 전부터는 그날 발송 시각으로 쓰지 않는다")
        void keepsMarginBeforeWindowEnd() {
            assertThat(policy.nextSendAt(kst("2026-11-25T20:55"), List.of())).isEqualTo(kst("2026-11-25T20:55"));
            assertThat(policy.nextSendAt(kst("2026-11-25T20:56"), List.of())).isEqualTo(kst("2026-11-26T08:00"));
        }

        @Test
        @DisplayName("그날 이미 예정된 발송이 있으면 하루 상한 때문에 다음 날 08:00 으로 미룬다")
        void dailyLimitPostponesToNextDay() {
            List<Instant> scheduled = List.of(kst("2026-11-25T09:00"));

            assertThat(policy.nextSendAt(kst("2026-11-25T10:00"), scheduled)).isEqualTo(kst("2026-11-26T08:00"));
            assertThat(policy.nextSendAt(kst("2026-11-25T07:00"), scheduled)).isEqualTo(kst("2026-11-26T08:00"));
        }

        @Test
        @DisplayName("이번 주(월~일)에 3건이 예정돼 있으면 다음 주 월요일 08:00 으로 미룬다")
        void weeklyLimitPostponesToNextWeek() {
            List<Instant> scheduled = List.of(kst("2026-11-23T09:00"), kst("2026-11-24T09:00"), kst("2026-11-25T09:00"));

            assertThat(policy.nextSendAt(kst("2026-11-25T22:00"), scheduled)).isEqualTo(kst("2026-11-30T08:00"));
        }

        @Test
        @DisplayName("일요일 발송은 그 주에 센다. 월요일부터 새 주다")
        void weekStartsOnMonday() {
            List<Instant> sundayWeek = List.of(kst("2026-11-22T09:00"), kst("2026-11-21T09:00"), kst("2026-11-20T09:00"));

            assertThat(policy.nextSendAt(kst("2026-11-23T10:00"), sundayWeek)).isEqualTo(kst("2026-11-23T10:00"));
        }
    }

    @Nested
    @DisplayName("허용 시간 확인")
    class Window {

        @Test
        @DisplayName("시작 시각은 포함하고 끝 시각은 포함하지 않는다 (07:59 / 08:00 / 20:59 / 21:00)")
        void boundaries() {
            assertThat(policy.isWithinWindow(kst("2026-11-25T07:59"))).isFalse();
            assertThat(policy.isWithinWindow(kst("2026-11-25T08:00"))).isTrue();
            assertThat(policy.isWithinWindow(kst("2026-11-25T20:59"))).isTrue();
            assertThat(policy.isWithinWindow(kst("2026-11-25T21:00"))).isFalse();
        }
    }

    @Test
    @DisplayName("허용 시간이 너무 짧거나 상한이 1 미만이면 만들 수 없다")
    void rejectsInvalidSettings() {
        assertThatThrownBy(() -> new NewsSendPolicy(KST, LocalTime.of(21, 0), LocalTime.of(8, 0), 1, 3))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new NewsSendPolicy(KST, LocalTime.of(8, 0), LocalTime.of(8, 3), 1, 3))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new NewsSendPolicy(KST, LocalTime.of(8, 0), LocalTime.of(21, 0), 0, 3))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new NewsSendPolicy(KST, LocalTime.of(8, 0), LocalTime.of(21, 0), 1, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private Instant kst(final String dateTime) {
        return LocalDateTime.parse(dateTime).atZone(KST).toInstant();
    }
}
