package com.gachi.gacha.server.news.evaluation;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsReview;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsTiming;
import com.gachi.gacha.server.news.evaluation.NewsEvaluator.Answer;
import com.gachi.gacha.server.news.evaluation.NewsEvaluator.MissReason;
import com.gachi.gacha.server.news.evaluation.NewsEvaluator.Report;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class NewsEvaluatorTest {

    private static final String HEADER = "account,link,posted_at,summary,section,kind,start_date,end_date,push_target\n";
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 9);

    private final NewsEvaluator evaluator = new NewsEvaluator();

    @Nested
    @DisplayName("정답 세트 읽기")
    class Parse {

        @Test
        @DisplayName("따옴표 안의 쉼표·줄바꿈·큰따옴표, 빈 줄, 시간대 있는 게시 시각을 읽는다")
        void readsQuotedFieldsAndTimeZones() {
            List<Answer> answers = evaluator.parse(HEADER
                    + "chiikawashop_kr,https://x.com/a/status/1,2026-11-05T09:30:00+09:00,\"입고, \"\"신상\"\"\n리스트\",korea_store,release,2026-11-12,,O\r\n"
                    + "\n"
                    + "chiikawa_market,https://twitter.com/i/status/2?s=20,2026-11-05 00:00:00Z,마켓 발매,japan_official,preorder,,2026-11-30,X\n");

            assertThat(answers).hasSize(2);
            assertThat(answers.getFirst().summary()).isEqualTo("입고, \"신상\"\n리스트");
            assertThat(answers.getFirst().postedAt()).isEqualTo(LocalDateTime.of(2026, 11, 5, 9, 30));
            assertThat(answers.getFirst().startDate()).isEqualTo(LocalDate.of(2026, 11, 12));
            assertThat(answers.getFirst().pushTarget()).isTrue();
            assertThat(answers.get(1).linkKey()).isEqualTo("x:2");
            assertThat(answers.get(1).postedAt()).isEqualTo(LocalDateTime.of(2026, 11, 5, 9, 0));
            assertThat(answers.get(1).startDate()).isNull();
            assertThat(answers.get(1).line()).isEqualTo(5);
        }

        @Test
        @DisplayName("헤더가 다르거나 값이 허용 범위를 벗어나면 몇 번째 줄인지 알려준다")
        void reportsInvalidLines() {
            assertThatThrownBy(() -> evaluator.parse("link,summary\nx,y\n")).hasMessageContaining("첫 줄은 헤더");
            assertThatThrownBy(() -> evaluator.parse(HEADER + row("bad_section", "release", "O")))
                    .hasMessage("2번째 줄: section 허용 값 아님: bad_section");
            assertThatThrownBy(() -> evaluator.parse(HEADER + row("korea_store", "신상품", "O")))
                    .hasMessage("2번째 줄: kind 허용 값 아님: 신상품");
            assertThatThrownBy(() -> evaluator.parse(HEADER + row("korea_store", "release", "Y")))
                    .hasMessage("2번째 줄: push_target 은 O 또는 X 여야 한다: Y");
            assertThatThrownBy(() -> evaluator.parse(HEADER + "a,https://x.com/a/status/1,어제,요약,korea_store,release,,,O\n"))
                    .hasMessageContaining("2번째 줄: posted_at 형식");
            assertThatThrownBy(() -> evaluator.parse(HEADER + "a,https://x.com/a/status/1,2026-11-05T09:30,요약,korea_store,release,11/12,,O\n"))
                    .hasMessageContaining("start_date 형식");
            assertThatThrownBy(() -> evaluator.parse(HEADER + "a,링크만\n")).hasMessageContaining("열이 9개여야 한다");
        }

        @Test
        @DisplayName("표기가 달라도 같은 게시물이 두 번 있으면 막는다")
        void rejectsDuplicatePost() {
            assertThatThrownBy(() -> evaluator.parse(HEADER
                    + "a,https://x.com/a/status/1,2026-11-05T09:30,요약,korea_store,release,,,O\n"
                    + "a,https://twitter.com/i/status/1?s=20,2026-11-05T09:30,요약,korea_store,release,,,O\n"))
                    .hasMessage("3번째 줄: 2번째 줄과 같은 게시물이다");
        }
    }

    @Nested
    @DisplayName("지표 계산")
    class Metrics {

        @Test
        @DisplayName("누락률은 푸시 대상 정답 중 푸시 대상으로 찾지 못한 비율이고, 못 찾은 이유를 나눈다")
        void missRateWithReasons() {
            List<Answer> answers = evaluator.parse(HEADER
                    + answer(1, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(2, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(3, "korea_online", "restock", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(4, "korea_store", "notice", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(5, "korea_store", "popup", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(6, "japan_official", "release", "2026-11-05T09:00", "2026-11-12", "X"));
            List<NewsCandidate> candidates = List.of(
                    candidate(1, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null),
                    candidate(3, NewsSection.OTHER_GOODS, NewsKind.RESTOCK, true, null),
                    candidate(4, NewsSection.KOREA_STORE, NewsKind.NOTICE, null, null),
                    candidate(5, NewsSection.KOREA_STORE, NewsKind.POPUP, true, LocalDate.of(2026, 11, 1)));

            Report report = evaluator.evaluate(answers, candidates);

            assertThat(report.pushAnswerCount()).isEqualTo(5);
            assertThat(report.misses()).extracting(miss -> miss.answer().linkKey(), miss -> miss.reason()).containsExactly(
                    org.assertj.core.api.Assertions.tuple("x:2", MissReason.NOT_COLLECTED),
                    org.assertj.core.api.Assertions.tuple("x:3", MissReason.TAB_ONLY),
                    org.assertj.core.api.Assertions.tuple("x:4", MissReason.NEEDS_CHECK),
                    org.assertj.core.api.Assertions.tuple("x:5", MissReason.ENDED));
            assertThat(report.missRate()).contains(0.8);
            assertThat(report.meetsMissTarget()).isFalse();
        }

        @Test
        @DisplayName("오탐은 푸시 대상이라고 했는데 정답이 X 인 수이고, 정답에 없는 푸시 대상은 따로 보여준다")
        void falsePositivesAndUnlisted() {
            List<Answer> answers = evaluator.parse(HEADER
                    + answer(1, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(2, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "X"));
            List<NewsCandidate> candidates = List.of(
                    candidate(1, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null),
                    candidate(2, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null),
                    candidate(9, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null));

            Report report = evaluator.evaluate(answers, candidates);

            assertThat(report.falsePositives()).extracting(NewsCandidate::linkKey).containsExactly("x:2");
            assertThat(report.unlistedPushTargets()).extracting(NewsCandidate::linkKey).containsExactly("x:9");
            assertThat(report.missRate()).contains(0.0);
            assertThat(report.meetsMissTarget()).isTrue();
        }

        @Test
        @DisplayName("이전 규칙으로 탭 공개로만 저장된 후보도 현재 규칙의 푸시 대상이면 푸시 대상으로 평가한다")
        void reappliesCurrentPushRuleToStoredTabOnly() {
            List<Answer> answers = evaluator.parse(HEADER
                    + answer(1, "japan_official", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(2, "japan_official", "notice", "2026-11-05T09:00", "2026-11-12", "O"));
            NewsCandidate release = candidate(1, NewsSection.JAPAN_OFFICIAL, NewsKind.RELEASE, true, null);
            NewsCandidate notice = candidate(2, NewsSection.JAPAN_OFFICIAL, NewsKind.NOTICE, true, null);
            org.springframework.test.util.ReflectionTestUtils.setField(release, "review", NewsReview.TAB_ONLY);

            Report report = evaluator.evaluate(answers, List.of(release, notice));

            assertThat(report.misses()).extracting(miss -> miss.answer().linkKey(), miss -> miss.reason())
                    .containsExactly(org.assertj.core.api.Assertions.tuple("x:2", MissReason.TAB_ONLY));
        }

        @Test
        @DisplayName("분류 일치율은 찾은 정답 중 section 과 kind 가 모두 같은 비율이다")
        void classificationRate() {
            List<Answer> answers = evaluator.parse(HEADER
                    + answer(1, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(2, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(3, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O")
                    + answer(4, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O"));
            List<NewsCandidate> candidates = List.of(
                    candidate(1, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null),
                    candidate(2, NewsSection.KOREA_ONLINE, NewsKind.RELEASE, true, null),
                    candidate(3, NewsSection.KOREA_STORE, NewsKind.RESTOCK, true, null));

            Report report = evaluator.evaluate(answers, candidates);

            assertThat(report.foundAnswerCount()).isEqualTo(3);
            assertThat(report.classifiedCount()).isEqualTo(1);
            assertThat(report.classificationRate().orElseThrow()).isCloseTo(1.0 / 3, org.assertj.core.data.Offset.offset(1e-9));
            assertThat(report.mismatches()).extracting(mismatch -> mismatch.answer().linkKey()).containsExactly("x:2", "x:3");
        }

        @Test
        @DisplayName("같은 게시물이 여러 회차에 있으면 먼저 저장된 후보로 센다")
        void usesFirstCandidatePerPost() {
            List<Answer> answers = evaluator.parse(HEADER + answer(1, "korea_store", "release", "2026-11-05T09:00", "2026-11-12", "O"));

            Report report = evaluator.evaluate(answers, List.of(
                    candidate(1, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null),
                    candidate(1, NewsSection.OTHER_GOODS, NewsKind.RELEASE, true, null)));

            assertThat(report.misses()).isEmpty();
            assertThat(report.classifiedCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("푸시 대상 정답이나 찾은 정답이 없으면 비율은 측정 불가이고 목표를 충족한 것으로 보지 않는다")
        void emptyDenominators() {
            Report report = evaluator.evaluate(evaluator.parse(HEADER
                    + answer(1, "japan_official", "release", "2026-11-05T09:00", "2026-11-12", "X")), List.of());

            assertThat(report.missRate()).isEmpty();
            assertThat(report.classificationRate()).isEmpty();
            assertThat(report.beforeEventRate()).isEmpty();
            assertThat(report.meetsMissTarget()).isFalse();
            assertThat(report.meetsBeforeEventTarget()).isFalse();
        }
    }

    @Nested
    @DisplayName("행사 전 도착")
    class BeforeEvent {

        @Test
        @DisplayName("게시 이후 첫 수집은 월 18:30 / 목 12:30 이고, 같은 시각에 게시했으면 다음 수집이다")
        void firstCollectionAfter() {
            // 2026-11-09 월, 11-12 목
            assertThat(evaluator.firstCollectionAfter(LocalDateTime.of(2026, 11, 9, 18, 29))).isEqualTo(LocalDateTime.of(2026, 11, 9, 18, 30));
            assertThat(evaluator.firstCollectionAfter(LocalDateTime.of(2026, 11, 9, 18, 30))).isEqualTo(LocalDateTime.of(2026, 11, 12, 12, 30));
            assertThat(evaluator.firstCollectionAfter(LocalDateTime.of(2026, 11, 10, 9, 0))).isEqualTo(LocalDateTime.of(2026, 11, 12, 12, 30));
            assertThat(evaluator.firstCollectionAfter(LocalDateTime.of(2026, 11, 12, 12, 31))).isEqualTo(LocalDateTime.of(2026, 11, 16, 18, 30));
            assertThat(evaluator.firstCollectionAfter(LocalDateTime.of(2026, 11, 14, 3, 0))).isEqualTo(LocalDateTime.of(2026, 11, 16, 18, 30));
        }

        @Test
        @DisplayName("첫 수집이 행사 시작일 00:00 보다 이르면 행사 전에 도착한 것이다. 행사 시작일을 모르면 계산에서 뺀다")
        void beforeEventRate() {
            List<Answer> answers = evaluator.parse(HEADER
                    // 월 10:00 게시 → 월 18:30 수집, 행사 11/10 → 전
                    + answer(1, "korea_store", "release", "2026-11-09T10:00", "2026-11-10", "O")
                    // 목 11:00 게시 → 목 12:30 수집, 행사 11/12 00:00 이 이미 지남 → 후
                    + answer(2, "korea_store", "release", "2026-11-12T11:00", "2026-11-12", "O")
                    // 수 15:00 게시 → 목 12:30 수집, 행사 11/13 → 전
                    + answer(3, "korea_store", "release", "2026-11-11T15:00", "2026-11-13", "O")
                    // 행사 시작일을 모름
                    + answer(4, "korea_store", "release", "2026-11-11T15:00", "", "O")
                    // 푸시 대상이 아니면 계산하지 않음
                    + answer(5, "korea_store", "release", "2026-11-11T15:00", "2026-11-13", "X"));

            Report report = evaluator.evaluate(answers, List.of());

            assertThat(report.arrivals()).hasSize(4);
            assertThat(report.beforeEventRate().orElseThrow()).isCloseTo(2.0 / 3, org.assertj.core.data.Offset.offset(1e-9));
            assertThat(report.meetsBeforeEventTarget()).isFalse();
        }
    }

    @Test
    @DisplayName("보고서는 지표와 목표 판정, 누락 이유, 오탐을 보여주고, 목표에 못 미쳐도 그대로 수치를 알린다")
    void markdownReport() {
        List<Answer> answers = evaluator.parse(HEADER
                + answer(1, "korea_store", "release", "2026-11-09T10:00", "2026-11-10", "O")
                + answer(2, "korea_store", "release", "2026-11-12T11:00", "2026-11-12", "O")
                + answer(3, "korea_store", "release", "2026-11-09T10:00", "", "X"));
        Report report = evaluator.evaluate(answers, List.of(
                candidate(1, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null),
                candidate(3, NewsSection.KOREA_STORE, NewsKind.RELEASE, true, null)));

        String markdown = evaluator.toMarkdown(report);

        assertThat(markdown).contains("정답 3건 (푸시 대상 O 2건)")
                .contains("| 누락률 | 50.0% (1/2) | 10% 이하 | 미달 |")
                .contains("| 오탐 | 1건 | - | - |")
                .contains("| 분류 일치율 | 100.0% (2/2) | - | - |")
                .contains("| 행사 전 도착률 | 50.0% (1/2) | 80% 이상 | 미달 |")
                .contains("## 누락 (푸시 대상인데 찾지 못함) 1건")
                .contains("— 수집하지 못함")
                .contains("## 행사 전에 도착하지 못한 소식 1건");
    }

    private String row(final String section, final String kind, final String pushTarget) {
        return "a,https://x.com/a/status/1,2026-11-05T09:30,요약," + section + "," + kind + ",,," + pushTarget + "\n";
    }

    private String answer(final long id, final String section, final String kind, final String postedAt,
                          final String startDate, final String pushTarget) {
        return "a,https://x.com/a/status/" + id + "," + postedAt + ",요약 " + id + "," + section + "," + kind + ","
                + startDate + ",," + pushTarget + "\n";
    }

    private NewsCandidate candidate(
            final long id,
            final NewsSection section,
            final NewsKind kind,
            @Nullable final Boolean linkVerified,
            @Nullable final LocalDate endDate
    ) {
        NewsTiming timing = NewsTiming.judge(null, endDate, "후보 " + id, null, TODAY);
        return NewsCandidate.collected(1L, news(section, kind, "후보 " + id, null, endDate,
                "https://x.com/a/status/" + id, linkVerified, timing));
    }
}
