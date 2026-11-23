package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.CollectedNews;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsTiming;
import com.gachi.gacha.server.news.infra.SlackClient.SlackMessage;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class NewsSlackMessageBuilderTest {

    private static final LocalDate FROM = LocalDate.of(2026, 11, 9);
    private static final LocalDate TO = LocalDate.of(2026, 11, 12);
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 12);
    private static final GrokUsage USAGE = new GrokUsage(12, 1, 23, 0, 90000, 9000, 1_500_000_000L);

    private final NewsSlackMessageBuilder builder = new NewsSlackMessageBuilder(
            NewsFixtures.properties(false, "[개발]", 40, 0.6), JsonMapper.builder().build());

    @Test
    @DisplayName("실행 보고 한 줄: 확인한 게시물, 새 푸시 대상, 탭 공개 대상, 확인 필요, 비용, 프롬프트 버전을 보여준다")
    void summaryLine() {
        NewsRunResult.Finished result = finished(false, true, List.of(
                candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "용산점 입고", LocalDate.of(2026, 11, 13), null, "https://x.com/a/status/1", true),
                candidate(NewsSection.JAPAN_OFFICIAL, NewsKind.PREORDER, "연하엽서", LocalDate.of(2026, 11, 20), null, "https://x.com/b/status/2", true),
                candidate(NewsSection.KOREA_STORE, NewsKind.NOTICE, "링크 없음", null, null, null, null),
                candidate(NewsSection.KOREA_STORE, NewsKind.NOTICE, "예약 마감 안내", null, null, "https://x.com/a/status/3", true)));

        assertThat(builder.summary(result)).isEqualTo("목요일 수집 완료 · 게시물 23건 확인 · 새 푸시 대상 1건 · 탭 공개 대상 2건 · "
                + "확인 필요 1건 · 비용 $0.1500 · 프롬프트 chiikawa-v2");
    }

    @Test
    @DisplayName("푸시 대상은 행사 시작이 빠른 순으로, 종류·날짜·구분·링크와 함께 보여준다")
    void listsPushTargetsByStartDate() {
        NewsCandidate later = candidate(NewsSection.KOREA_ONLINE, NewsKind.RESTOCK, "재입고", LocalDate.of(2026, 11, 20), null,
                "https://x.com/a/status/2", true);
        NewsCandidate earlier = candidate(NewsSection.KOREA_STORE, NewsKind.ENTRY_RESERVATION, "예약 입장 안내",
                LocalDate.of(2026, 11, 13), LocalDate.of(2026, 11, 15), "https://x.com/a/status/1", true);
        NewsCandidate middle = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "중간 입고", LocalDate.of(2026, 11, 16), null,
                "https://x.com/a/status/9", true);

        String text = text(builder.build(finished(false, true, List.of(later, middle, earlier))));

        assertThat(text).contains("*푸시 대상 3건*");
        assertThat(text.indexOf("예약 입장 안내")).isLessThan(text.indexOf("중간 입고"));
        assertThat(text.indexOf("중간 입고")).isLessThan(text.indexOf("재입고"));
        assertThat(text).contains("• [입장예약 11/13(금)~11/15(일)] 예약 입장 안내 · 한국 매장 · <https://x.com/a/status/1|게시물>")
                .contains("• [재입고 11/20(금)] 재입고 · 한국 온라인")
                .contains("중간 입고 · 한국 매장");
    }

    @Test
    @DisplayName("탭에만 공개, 확인 필요(링크 없음), 지난 소식은 따로 모아 보여준다")
    void listsOtherGroups() {
        String text = text(builder.build(finished(false, true, List.of(
                candidate(NewsSection.OVERSEAS, NewsKind.POPUP, "하와이 팝업", LocalDate.of(2026, 11, 14), null, "https://x.com/c/status/3", true),
                candidate(NewsSection.KOREA_STORE, NewsKind.NOTICE, "링크가 없는 소식", null, null, null, null),
                candidate(NewsSection.KOREA_STORE, NewsKind.NOTICE, "끝난 소식", null, LocalDate.of(2026, 11, 3), "https://x.com/a/status/4", true)))));

        assertThat(text).contains("*탭에만 공개 1건*").contains("하와이 팝업 · 해외")
                .contains("*확인 필요 (링크 미확인) 1건*").contains("링크가 없는 소식 · 한국 매장 · 링크 없음")
                .contains("*지난 소식 1건*").contains("끝난 소식");
    }

    @Test
    @DisplayName("환경 표시와 DRY-RUN 표시를 제목 앞에 붙이고, dry-run 이면 공개·푸시를 하지 않는다고 알린다")
    void showsEnvironmentAndDryRun() {
        String dryRun = text(builder.build(finished(true, true, List.of())));
        String real = text(builder.build(finished(false, true, List.of())));

        assertThat(dryRun).contains("*[개발] [DRY-RUN] 치이카와 신상 소식*").contains("dry-run 이라 공개와 푸시를 하지 않습니다");
        assertThat(real).contains("*[개발] 치이카와 신상 소식*").doesNotContain("DRY-RUN").doesNotContain("dry-run");
    }

    @Test
    @DisplayName("일부 계정이 실패하면 그 계정과 이유를 보여주고, 수집 기간은 모든 계정을 보여준다")
    void showsPartialFailure() {
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr"), true, USAGE, List.of("[JP_kouhou_2026-11-09] HTTP 503 오류"));
        NewsRunResult.Finished result = new NewsRunResult.Finished(batch, List.of(candidate(NewsSection.KOREA_STORE,
                NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true)), NewsRunResult.Stats.NONE);

        String text = text(builder.build(result));

        assertThat(builder.summary(result)).startsWith("목요일 수집 완료 (일부 계정 실패) · ");
        assertThat(text).contains("• chiikawashop_kr  11/9 ~ 11/12  ✅")
                .contains("• chiikawa_kouhou  11/9 ~ 11/12  ❌ 수집하지 못함")
                .contains("*확인할 내용*").contains("[JP_kouhou_2026-11-09] HTTP 503 오류");
    }

    @Test
    @DisplayName("수집이 실패하면 마지막 경고를 원인으로 보여준다")
    void showsFailureReason() {
        NewsBatch batch = batch(false);
        batch.fail(USAGE, List.of("[KR_shop_2026-11-09] HTTP 401", "모든 계정의 수집에 실패함"));
        NewsRunResult.Finished result = new NewsRunResult.Finished(batch, List.of(), NewsRunResult.Stats.NONE);

        assertThat(builder.summary(result)).isEqualTo("목요일 수집 실패 · 원인: 모든 계정의 수집에 실패함 · 비용 $0.1500 · 프롬프트 chiikawa-v2");
    }

    @Test
    @DisplayName("새 소식이 없으면 그렇게 알리고, 건너뛴 수집은 한 줄 경고를 보낸다")
    void noNewsAndSkipped() {
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), false, USAGE, List.of());
        NewsRunResult.Finished noNews = new NewsRunResult.Finished(batch, List.of(), NewsRunResult.Stats.NONE);

        SlackMessage skipped = builder.skipped(new NewsRunResult.Skipped("CHIIKAWA", "THURSDAY", "이미 수집 중인 회차가 있음"));

        assertThat(builder.summary(noNews)).contains("수집 완료 · 게시물 23건 확인 · 새 소식 없음 · 새 푸시 대상 0건");
        assertThat(skipped.text()).isEqualTo("[개발] 치이카와 신상 소식 · 목요일 수집을 건너뜀: 이미 수집 중인 회차가 있음");
        assertThat(skipped.blocks()).hasSize(1);
    }

    @Test
    @DisplayName("슬랙에서 특수 문자인 & < > 는 바꾸고, 안전하지 않은 링크는 링크로 걸지 않는다")
    void escapesTextAndRejectsUnsafeLinks() {
        String text = text(builder.build(finished(false, true, List.of(
                candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "A&B <최신> 입고", null, null, "https://x.com/a/status/1|evil>", true)))));

        assertThat(text).contains("A&amp;B &lt;최신&gt; 입고").doesNotContain("evil");
        assertThat(NewsSlackMessageBuilder.escape(null)).isEmpty();
    }

    @Test
    @DisplayName("목록이 길면 줄 수를 줄이고 외 N건으로 알리며, 글 블록 하나는 3000자, 메시지는 블록 50개를 넘지 않는다")
    void respectsSlackLimits() {
        List<NewsCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < 100; index++) {
            candidates.add(candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "아주 긴 제목 ".repeat(30) + index, null, null,
                    "https://x.com/a/status/" + (1000 + index), true));
        }
        List<String> warnings = new ArrayList<>();
        for (int index = 0; index < 40; index++) {
            warnings.add("경고 " + index + " ".repeat(10) + "길게".repeat(80));
        }
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, warnings);

        SlackMessage message = builder.build(new NewsRunResult.Finished(batch, candidates, NewsRunResult.Stats.NONE));

        assertThat(message.blocks().size()).isLessThanOrEqualTo(50);
        for (JsonNode block : message.blocks()) {
            assertThat(block.path("text").path("text").asString().length()).isLessThanOrEqualTo(3000);
        }
        assertThat(text(message)).contains("… 외 70건").contains("… 외 25건");
    }

    private NewsRunResult.Finished finished(final boolean dryRun, final boolean collected, final List<NewsCandidate> candidates) {
        NewsBatch batch = batch(dryRun);
        batch.complete(collected ? Set.of("chiikawashop_kr", "chiikawa_kouhou") : Set.of(), true, USAGE, List.of());
        return new NewsRunResult.Finished(batch, candidates, NewsRunResult.Stats.NONE);
    }

    private NewsBatch batch(final boolean dryRun) {
        NewsBatch batch = NewsBatch.start("CHIIKAWA", "THURSDAY", List.of(
                CollectPeriod.notCollected("chiikawashop_kr", FROM, TO),
                CollectPeriod.notCollected("chiikawa_kouhou", FROM, TO)), dryRun, "chiikawa-v2");
        ReflectionTestUtils.setField(batch, "id", 7L);
        return batch;
    }

    private NewsCandidate candidate(
            final NewsSection section,
            final NewsKind kind,
            final String title,
            @Nullable final LocalDate start,
            @Nullable final LocalDate end,
            @Nullable final String link,
            @Nullable final Boolean verified
    ) {
        NewsTiming timing = NewsTiming.judge(start, end, title, null, TODAY);
        CollectedNews collected = news(section, kind, title, start, end, link, verified, timing);
        NewsCandidate candidate = NewsCandidate.collected(7L, collected);
        ReflectionTestUtils.setField(candidate, "id", (long) title.hashCode());
        return candidate;
    }

    private String text(final SlackMessage message) {
        StringBuilder text = new StringBuilder();
        for (JsonNode block : message.blocks()) {
            text.append(block.path("text").path("text").asString()).append('\n');
        }
        return text.toString();
    }
}
