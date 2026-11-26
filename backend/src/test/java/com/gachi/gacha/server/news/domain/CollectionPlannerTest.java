package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CollectionPlannerTest {

    private static final CollectTarget KR_SHOP = new CollectTarget("KR_shop", "chiikawashop_kr", 2, true, "");
    private static final CollectTarget KR_MARKET = new CollectTarget("KR_market", "chiikawa_m_kr", 2, true, "");
    private static final CollectTarget JP_MARKET = new CollectTarget(
            "JP_market", "chiikawa_market", 1, false, "-filter:replies -filter:retweets");
    private static final CollectTarget JP_KOUHOU = new CollectTarget(
            "JP_kouhou", "chiikawa_kouhou", 7, false, "-filter:replies -filter:retweets");
    private static final List<CollectTarget> MONDAY_TARGETS = List.of(KR_SHOP, KR_MARKET);
    private static final List<CollectTarget> THURSDAY_TARGETS = List.of(KR_SHOP, KR_MARKET, JP_MARKET, JP_KOUHOU);

    /**
     * 월 18:30 KST = 월 09:30 UTC, 목 12:30 KST = 목 03:30 UTC 라서 수집일의 UTC 날짜는 KST 날짜와 같다.
     */
    private static final LocalDate LAST_THURSDAY = LocalDate.of(2026, 11, 5);
    private static final LocalDate MONDAY = LocalDate.of(2026, 11, 9);
    private static final LocalDate THURSDAY = LocalDate.of(2026, 11, 12);
    private static final LocalDate NEXT_MONDAY = LocalDate.of(2026, 11, 16);

    private final CollectionPlanner planner = new CollectionPlanner(7, 14);

    @Nested
    @DisplayName("계정별 수집 기간")
    class Periods {

        @Test
        @DisplayName("기록이 없으면 최근 7일이다")
        void defaultsToSevenDays() {
            assertThat(planner.periods(THURSDAY_TARGETS, List.of(), THURSDAY)).allSatisfy(period -> {
                assertThat(period.from()).isEqualTo(LAST_THURSDAY);
                assertThat(period.to()).isEqualTo(THURSDAY);
                assertThat(period.collected()).isFalse();
            });
        }

        @Test
        @DisplayName("계정마다 마지막으로 수집에 성공한 회차의 기간 끝부터다 (목요일: 한국 3일, 일본 7일)")
        void continuesFromLastSuccessPerAccount() {
            NewsBatch monday = collected("MONDAY", true, period("chiikawashop_kr", LAST_THURSDAY, MONDAY),
                    period("chiikawa_m_kr", LAST_THURSDAY, MONDAY));
            NewsBatch lastThursday = collected("THURSDAY", true,
                    period("chiikawashop_kr", MONDAY.minusDays(7), LAST_THURSDAY),
                    period("chiikawa_market", LAST_THURSDAY.minusDays(7), LAST_THURSDAY),
                    period("chiikawa_kouhou", LAST_THURSDAY.minusDays(7), LAST_THURSDAY));

            List<CollectPeriod> periods = planner.periods(THURSDAY_TARGETS, List.of(monday, lastThursday), THURSDAY);

            assertThat(periods).extracting(CollectPeriod::handle, CollectPeriod::from, CollectPeriod::days).containsExactly(
                    tuple("chiikawashop_kr", MONDAY, 3),
                    tuple("chiikawa_m_kr", MONDAY, 3),
                    tuple("chiikawa_market", LAST_THURSDAY, 7),
                    tuple("chiikawa_kouhou", LAST_THURSDAY, 7));
        }

        @Test
        @DisplayName("일부 구간이 실패한 계정은 그 회차의 기간 끝을 쓰지 않고, 이전에 성공한 기록으로 돌아간다")
        void failedAccountKeepsLastSuccessfulCursor() {
            NewsBatch lastThursday = collected("THURSDAY", true,
                    period("chiikawashop_kr", MONDAY.minusDays(7), LAST_THURSDAY),
                    period("chiikawa_kouhou", LAST_THURSDAY.minusDays(7), LAST_THURSDAY));
            // 월요일: 치이카와샵은 성공, 홍보 계정은 일부 구간이 실패해서 수집하지 못함
            NewsBatch monday = NewsBatch.start("CHIIKAWA", "MONDAY",
                    List.of(period("chiikawashop_kr", LAST_THURSDAY, MONDAY), period("chiikawa_kouhou", LAST_THURSDAY, MONDAY)),
                    false, "chiikawa-v2");
            monday.complete(Set.of("chiikawashop_kr"), true, GrokUsage.NONE, List.of());

            Map<String, LocalDate> lastUntil = CollectionPlanner.lastCollectedUntil(List.of(monday, lastThursday));

            assertThat(lastUntil).containsEntry("chiikawashop_kr", MONDAY).containsEntry("chiikawa_kouhou", LAST_THURSDAY);
            assertThat(planner.periods(List.of(JP_KOUHOU), List.of(monday, lastThursday), THURSDAY))
                    .extracting(CollectPeriod::from).containsExactly(LAST_THURSDAY);
        }

        @Test
        @DisplayName("수집 중이거나 실패한 회차, [다시 수집]으로 버린 회차는 수집한 것으로 보지 않고, 만료된 회차는 본다")
        void skipsUncollectedAndDiscarded() {
            NewsBatch collecting = NewsBatch.start("CHIIKAWA", "THURSDAY",
                    List.of(period("chiikawashop_kr", MONDAY, THURSDAY)), false, "chiikawa-v2");
            NewsBatch failed = NewsBatch.start("CHIIKAWA", "THURSDAY",
                    List.of(period("chiikawashop_kr", MONDAY, THURSDAY)), false, "chiikawa-v2");
            failed.fail(GrokUsage.NONE, List.of("에러"));
            NewsBatch discarded = collected("THURSDAY", true, period("chiikawashop_kr", MONDAY, THURSDAY));
            discarded.discard();
            NewsBatch expiredMonday = collected("MONDAY", true, period("chiikawashop_kr", LAST_THURSDAY, MONDAY));
            expiredMonday.expire();

            assertThat(CollectionPlanner.lastCollectedUntil(List.of(collecting, failed, discarded, expiredMonday)))
                    .containsExactlyEntriesOf(Map.of("chiikawashop_kr", MONDAY));
        }

        @Test
        @DisplayName("기간이 최대 일수를 넘으면 줄이고, 마지막 기록이 오늘보다 늦으면 오늘부터로 둔다")
        void clampsToLimits() {
            NewsBatch longAgo = collected("THURSDAY", true,
                    period("chiikawashop_kr", THURSDAY.minusDays(40), THURSDAY.minusDays(30)));
            NewsBatch future = collected("THURSDAY", true, period("chiikawa_m_kr", THURSDAY, THURSDAY.plusDays(1)));

            List<CollectPeriod> periods = planner.periods(MONDAY_TARGETS, List.of(future, longAgo), THURSDAY);

            assertThat(periods).extracting(CollectPeriod::from).containsExactly(THURSDAY.minusDays(14), THURSDAY);
        }

        @Test
        @DisplayName("기간 설정이 잘못되면 만들 수 없다")
        void rejectsInvalidSettings() {
            assertThatThrownBy(() -> new CollectionPlanner(0, 14)).isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> new CollectionPlanner(7, 6)).isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> period("a", THURSDAY, MONDAY)).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("호출 분할")
    class Calls {

        @Test
        @DisplayName("처음 7일 수집은 스크립트처럼 16번 호출한다 (한국 2일×4, 마켓 1일×7, 홍보 7일×1)")
        void matchesScriptCallCountForSevenDays() {
            List<CollectCall> calls = planner.calls(THURSDAY_TARGETS, planner.periods(THURSDAY_TARGETS, List.of(), THURSDAY));

            assertThat(calls).hasSize(16);
            assertThat(calls).filteredOn(call -> call.target() == KR_SHOP).extracting(CollectCall::from, CollectCall::to)
                    .containsExactly(
                            tuple(LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 7)),
                            tuple(LocalDate.of(2026, 11, 7), LocalDate.of(2026, 11, 9)),
                            tuple(LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 11)),
                            tuple(LocalDate.of(2026, 11, 11), null));
            assertThat(calls).filteredOn(call -> call.target() == JP_KOUHOU).extracting(CollectCall::from, CollectCall::to)
                    .containsExactly(tuple(LAST_THURSDAY, null));
        }

        @Test
        @DisplayName("목요일은 12번(한국 2+2, 마켓 7, 홍보 1), 월요일은 4번 호출한다")
        void callsPerScheduledRun() {
            List<CollectCall> thursday = planner.calls(THURSDAY_TARGETS, List.of(
                    period("chiikawashop_kr", MONDAY, THURSDAY), period("chiikawa_m_kr", MONDAY, THURSDAY),
                    period("chiikawa_market", LAST_THURSDAY, THURSDAY), period("chiikawa_kouhou", LAST_THURSDAY, THURSDAY)));
            List<CollectCall> monday = planner.calls(MONDAY_TARGETS, List.of(
                    period("chiikawashop_kr", THURSDAY, NEXT_MONDAY), period("chiikawa_m_kr", THURSDAY, NEXT_MONDAY)));

            assertThat(thursday).hasSize(12);
            assertThat(monday).hasSize(4);
            assertThat(monday).filteredOn(call -> call.target() == KR_SHOP).extracting(CollectCall::from, CollectCall::to)
                    .containsExactly(tuple(THURSDAY, LocalDate.of(2026, 11, 14)), tuple(LocalDate.of(2026, 11, 14), null));
        }

        @Test
        @DisplayName("마지막 구간은 끝 날짜 없이 지금까지, 기간이 0일이면 오늘 하루를 한 번 검색한다")
        void openEndedAndZeroDay() {
            List<CollectCall> market = planner.calls(List.of(JP_MARKET), List.of(period("chiikawa_market", LAST_THURSDAY, THURSDAY)));
            List<CollectCall> today = planner.calls(List.of(KR_SHOP), List.of(period("chiikawashop_kr", THURSDAY, THURSDAY)));

            assertThat(market).hasSize(7);
            assertThat(market.getLast()).extracting(CollectCall::from, CollectCall::to)
                    .containsExactly(LocalDate.of(2026, 11, 11), null);
            assertThat(today).extracting(CollectCall::from, CollectCall::to).containsExactly(tuple(THURSDAY, null));
        }

        @Test
        @DisplayName("기간이 없는 계정이 있으면 호출을 만들 수 없다")
        void requiresPeriodForEveryTarget() {
            assertThatThrownBy(() -> planner.calls(MONDAY_TARGETS, List.of(period("chiikawashop_kr", MONDAY, THURSDAY))))
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("chiikawa_m_kr");
        }

        @Test
        @DisplayName("호출 이름, 프롬프트의 기간 표기, 검색어는 스크립트와 같다")
        void labelsMatchScript() {
            CollectCall closed = new CollectCall(JP_MARKET, LAST_THURSDAY, LocalDate.of(2026, 11, 6));
            CollectCall open = new CollectCall(KR_SHOP, LocalDate.of(2026, 11, 11), null);

            assertThat(closed.label()).isEqualTo("JP_market_2026-11-05");
            assertThat(closed.toLabel()).isEqualTo("2026-11-06 직전");
            assertThat(open.toLabel()).isEqualTo("오늘");
            assertThat(KR_SHOP.searchQuery()).isEqualTo("from:chiikawashop_kr");
            assertThat(JP_MARKET.searchQuery()).isEqualTo("from:chiikawa_market -filter:replies -filter:retweets");
            assertThatThrownBy(() -> new CollectTarget("A", "a", 0, false, "")).isInstanceOf(IllegalArgumentException.class);
        }
    }

    /**
     * @param allCollected 기간의 모든 계정을 수집한 회차로 만든다
     */
    private NewsBatch collected(final String runName, final boolean allCollected, final CollectPeriod... periods) {
        NewsBatch batch = NewsBatch.start("CHIIKAWA", runName, List.of(periods), false, "chiikawa-v2");
        Set<String> handles = allCollected
                ? Set.of(periods).stream().map(CollectPeriod::handle).collect(java.util.stream.Collectors.toSet())
                : Set.of();
        batch.complete(handles, true, GrokUsage.NONE, List.of());
        return batch;
    }

    private CollectPeriod period(final String handle, final LocalDate from, final LocalDate to) {
        return CollectPeriod.notCollected(handle, from, to);
    }
}
