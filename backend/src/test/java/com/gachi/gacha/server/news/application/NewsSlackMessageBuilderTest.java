package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.application.dto.BatchView;
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
import java.time.LocalDateTime;
import java.time.ZoneId;
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

        assertThat(builder.summary(view(result))).isEqualTo("목요일 수집 완료 · 게시물 23건 확인 · 새 푸시 대상 2건 · 탭 공개 대상 2건 · "
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
    @DisplayName("승인 요청에는 푸시 대상마다 [제외] 버튼, 맨 아래에 [승인] [다시 수집] [나에게 테스트 발송] 버튼을 단다")
    void approvalRequestHasButtons() {
        NewsCandidate first = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "첫째", LocalDate.of(2026, 11, 13), null,
                "https://x.com/a/status/1", true);
        NewsCandidate second = candidate(NewsSection.KOREA_ONLINE, NewsKind.RESTOCK, "둘째", LocalDate.of(2026, 11, 20), null,
                "https://x.com/a/status/2", true);
        ReflectionTestUtils.setField(first, "id", 101L);
        ReflectionTestUtils.setField(second, "id", 102L);

        SlackMessage message = builder.build(finished(false, true, List.of(second, first)));

        List<JsonNode> accessories = new ArrayList<>();
        message.blocks().forEach(block -> {
            if (block.has("accessory")) {
                accessories.add(block);
            }
        });
        assertThat(accessories).hasSize(2);
        assertThat(accessories.getFirst().path("text").path("text").asString()).contains("첫째");
        assertThat(accessories.getFirst().path("accessory").path("action_id").asString()).isEqualTo("news_exclude");
        assertThat(accessories.getFirst().path("accessory").path("value").asString()).isEqualTo("7:101");
        assertThat(accessories.get(1).path("accessory").path("value").asString()).isEqualTo("7:102");

        JsonNode actions = message.blocks().get(message.blocks().size() - 1);
        assertThat(actions.path("type").asString()).isEqualTo("actions");
        assertThat(actions.path("elements")).hasSize(3);
        assertThat(actions.path("elements").get(0).path("text").path("text").asString()).isEqualTo("승인");
        assertThat(actions.path("elements").get(0).path("action_id").asString()).isEqualTo("news_approve");
        assertThat(actions.path("elements").get(0).path("value").asString()).isEqualTo("7");
        assertThat(actions.path("elements").get(1).path("action_id").asString()).isEqualTo("news_recollect");
        assertThat(actions.path("elements").get(2).path("action_id").asString()).isEqualTo("news_test_send");
        assertThat(text(message)).contains("서로 다른 2명이 [승인]을 누르면 승인됩니다");
    }

    @Test
    @DisplayName("푸시 대상이 없으면 [승인(탭만 공개)] 만 달고, 보낼 푸시가 없으니 [나에게 테스트 발송]은 달지 않는다")
    void tabOnlyApprovalHasNoTestSend() {
        SlackMessage message = builder.build(finished(false, true, List.of(candidate(NewsSection.OVERSEAS, NewsKind.POPUP,
                "하와이 팝업", LocalDate.of(2026, 11, 14), null, "https://x.com/c/status/3", true))));

        JsonNode actions = message.blocks().get(message.blocks().size() - 1);
        assertThat(actions.path("elements")).hasSize(2);
        assertThat(actions.path("elements").get(0).path("text").path("text").asString()).isEqualTo("승인(탭만 공개)");
        assertThat(actions.path("elements").get(1).path("action_id").asString()).isEqualTo("news_recollect");
    }

    @Test
    @DisplayName("dry-run 이거나 승인할 소식이 없거나 수집이 실패한 보고에는 버튼을 달지 않는다")
    void noButtonsOutsideApprovalRequest() {
        NewsCandidate pushTarget = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", null, null,
                "https://x.com/a/status/1", true);
        NewsBatch noNews = batch(false);
        noNews.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), false, USAGE, List.of());
        NewsBatch failed = batch(false);
        failed.fail(USAGE, List.of("모든 계정의 수집에 실패함"));

        List<SlackMessage> messages = List.of(
                builder.build(finished(true, true, List.of(pushTarget))),
                builder.build(new NewsRunResult.Finished(noNews, List.of(), null)),
                builder.build(new NewsRunResult.Finished(failed, List.of(), null)),
                builder.skipped(new NewsRunResult.Skipped("CHIIKAWA", "THURSDAY", "이미 수집 중인 회차가 있음")));

        messages.forEach(message -> {
            assertThat(text(message)).doesNotContain("[승인]");
            message.blocks().forEach(block -> {
                assertThat(block.has("accessory")).isFalse();
                assertThat(block.path("type").asString()).isNotEqualTo("actions");
            });
        });
    }

    @Test
    @DisplayName("푸시 대상이 30건을 넘으면 버튼은 30건까지만 달고, 승인 버튼 줄은 블록이 많아도 잘리지 않는다")
    void keepsActionsWithinBlockLimit() {
        List<NewsCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < 60; index++) {
            NewsCandidate candidate = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "소식 " + index, null, null,
                    "https://x.com/a/status/" + (2000 + index), true);
            ReflectionTestUtils.setField(candidate, "id", 500L + index);
            candidates.add(candidate);
        }

        SlackMessage message = builder.build(finished(false, true, candidates));

        long buttons = message.blocks().findValues("accessory").size();
        assertThat(buttons).isEqualTo(30);
        assertThat(message.blocks().size()).isLessThanOrEqualTo(50);
        assertThat(message.blocks().get(message.blocks().size() - 1).path("type").asString()).isEqualTo("actions");
        assertThat(text(message)).contains("… 외 30건 (이 소식들은 [제외]를 달지 못했습니다)");
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
                NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true)), null);

        String text = text(builder.build(result));

        assertThat(builder.summary(view(result))).startsWith("목요일 수집 완료 (일부 계정 실패) · ");
        assertThat(text).contains("• chiikawashop_kr  11/9 ~ 11/12  ✅")
                .contains("• chiikawa_kouhou  11/9 ~ 11/12  ❌ 수집하지 못함")
                .contains("*확인할 내용*").contains("[JP_kouhou_2026-11-09] HTTP 503 오류");
    }

    @Test
    @DisplayName("수집이 실패하면 마지막 경고를 원인으로 보여준다")
    void showsFailureReason() {
        NewsBatch batch = batch(false);
        batch.fail(USAGE, List.of("[KR_shop_2026-11-09] HTTP 401", "모든 계정의 수집에 실패함"));
        NewsRunResult.Finished result = new NewsRunResult.Finished(batch, List.of(), null);

        assertThat(builder.summary(view(result))).isEqualTo("목요일 수집 실패 · 원인: 모든 계정의 수집에 실패함 · 비용 $0.1500 · 프롬프트 chiikawa-v2");
    }

    @Test
    @DisplayName("새 소식이 없으면 그렇게 알리고, 건너뛴 수집은 한 줄 경고를 보낸다")
    void noNewsAndSkipped() {
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), false, USAGE, List.of());
        NewsRunResult.Finished noNews = new NewsRunResult.Finished(batch, List.of(), null);

        SlackMessage skipped = builder.skipped(new NewsRunResult.Skipped("CHIIKAWA", "THURSDAY", "이미 수집 중인 회차가 있음"));

        assertThat(builder.summary(view(noNews))).contains("수집 완료 · 게시물 23건 확인 · 새 소식 없음 · 새 푸시 대상 0건");
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

        SlackMessage message = builder.build(new NewsRunResult.Finished(batch, candidates, null));

        assertThat(message.blocks().size()).isLessThanOrEqualTo(50);
        for (JsonNode block : message.blocks()) {
            assertThat(block.path("text").path("text").asString().length()).isLessThanOrEqualTo(3000);
        }
        assertThat(text(message)).contains("… 외 70건").contains("… 외 25건");
    }

    @Test
    @DisplayName("승인 대기 중에는 '승인 n/2' 진행과 승인한 사람을 보여주고, 첫 표 이후 변경이 있었다면 그 사람도 보여준다")
    void showsApprovalProgress() {
        NewsCandidate pushTarget = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true);
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());

        String none = text(builder.render(new BatchView(batch, List.of(pushTarget), List.of(), Set.of())));
        batch.markChangedAfterVote("U01CHANGER");
        String changed = text(builder.render(new BatchView(batch, List.of(pushTarget), List.of("U01VOTER1"), Set.of())));

        assertThat(none).contains("*승인 0/2*").doesNotContain("승인 후 변경");
        assertThat(changed).contains("*승인 1/2* · <@U01VOTER1>").contains("⚠️ 승인 후 변경 · <@U01CHANGER>");
    }

    @Test
    @DisplayName("제외한 소식은 취소선과 [되돌리기] 버튼으로 보여주고, 새 푸시 대상과 탭 공개 대상에서 빼며 제외 수를 알린다")
    void showsExcludedWithUndoButton() {
        NewsCandidate kept = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "남김", null, null, "https://x.com/a/status/1", true);
        NewsCandidate excluded = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "뺌", null, null, "https://x.com/a/status/2", true);
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        BatchView view = new BatchView(batch, List.of(kept, excluded), List.of(), Set.of(excluded.linkKey()));

        SlackMessage message = builder.render(view);

        assertThat(builder.summary(view)).contains("새 푸시 대상 1건 · 탭 공개 대상 1건").contains("제외 1건");
        assertThat(text(message)).contains("~• [발매 11/12(목)] 뺌 · 한국 매장 · <https://x.com/a/status/2|게시물>~ · 제외됨");
        List<JsonNode> accessories = new ArrayList<>();
        message.blocks().forEach(block -> {
            if (block.has("accessory")) {
                accessories.add(block.path("accessory"));
            }
        });
        assertThat(accessories).extracting(button -> button.path("action_id").asString(), button -> button.path("value").asString())
                .containsExactlyInAnyOrder(
                        org.assertj.core.api.Assertions.tuple("news_exclude", "7:" + kept.getId()),
                        org.assertj.core.api.Assertions.tuple("news_undo_exclude", "7:" + excluded.getId()));
    }

    @Test
    @DisplayName("제외한 소식 때문에 푸시 대상이 0건이 되면 [승인(탭만 공개)]로 바꾸고 테스트 발송 버튼을 뺀다")
    void allPushTargetsExcluded() {
        NewsCandidate excluded = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "뺌", null, null, "https://x.com/a/status/2", true);
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());

        SlackMessage message = builder.render(new BatchView(batch, List.of(excluded), List.of(), Set.of(excluded.linkKey())));

        JsonNode actions = message.blocks().get(message.blocks().size() - 1);
        assertThat(actions.path("elements")).hasSize(2);
        assertThat(actions.path("elements").get(0).path("text").path("text").asString()).isEqualTo("승인(탭만 공개)");
        assertThat(actions.path("elements").get(1).path("action_id").asString()).isEqualTo("news_recollect");
    }

    @Test
    @DisplayName("승인되면 버튼 없이 승인한 사람과 발송 예정 시각(또는 탭 공개)을 보여준다")
    void showsApprovedState() {
        NewsCandidate pushTarget = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true);
        NewsBatch scheduled = batch(false);
        scheduled.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        scheduled.approve(LocalDateTime.of(2026, 11, 12, 22, 0), serverTime(2026, 11, 13, 8, 0));
        NewsBatch tabOnly = batch(false);
        tabOnly.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        tabOnly.approve(LocalDateTime.of(2026, 11, 12, 22, 0), null);

        SlackMessage withPush = builder.render(new BatchView(scheduled, List.of(pushTarget), List.of("U1", "U2"), Set.of()));
        SlackMessage withoutPush = builder.render(new BatchView(tabOnly, List.of(), List.of("U1", "U2"), Set.of()));

        assertThat(text(withPush)).contains("✅ *승인됨* · <@U1>, <@U2> · 발송 예정 11/13(금) 08:00").doesNotContain("[승인]");
        assertThat(text(withoutPush)).contains("✅ *승인됨* · <@U1>, <@U2> · 탭에 공개됨");
        List.of(withPush, withoutPush).forEach(message -> message.blocks().forEach(block -> {
            assertThat(block.has("accessory")).isFalse();
            assertThat(block.path("type").asString()).isNotEqualTo("actions");
        }));
    }

    @Test
    @DisplayName("만료된 회차는 버튼 없이 '만료됨 · N건은 다음 묶음으로 이월'을, 버려진 회차는 다시 수집 안내를 보여준다")
    void showsExpiredAndDiscardedState() {
        NewsCandidate pushTarget = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true);
        NewsBatch expired = batch(false);
        expired.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        expired.expire();
        NewsBatch discarded = batch(false);
        discarded.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        discarded.discard();

        SlackMessage expiredMessage = builder.renderExpired(new BatchView(expired, List.of(pushTarget), List.of(), Set.of()), 3);
        SlackMessage discardedMessage = builder.render(new BatchView(discarded, List.of(pushTarget), List.of(), Set.of()));

        assertThat(text(expiredMessage)).contains("⏰ *만료됨* · 3건은 다음 묶음으로 이월");
        assertThat(text(discardedMessage)).contains("🔁 *다시 수집으로 버려짐*");
        List.of(expiredMessage, discardedMessage).forEach(message -> message.blocks().forEach(block -> {
            assertThat(block.has("accessory")).isFalse();
            assertThat(block.path("type").asString()).isNotEqualTo("actions");
        }));
    }

    @Test
    @DisplayName("이월된 후보에는 '이월'을 표시한다")
    void marksCarriedCandidates() {
        NewsCandidate origin = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "지난번 소식", null, null, "https://x.com/a/status/1", true);
        NewsCandidate carried = origin.carryTo(7L);

        String text = text(builder.build(finished(false, true, List.of(carried))));

        assertThat(text).contains("• [발매 11/12(목)] 지난번 소식 · 한국 매장 · <https://x.com/a/status/1|게시물> · 이월");
    }

    @Test
    @DisplayName("승인 안내 문구는 설정한 승인 인원 수를 따른다")
    void followsRequiredApprovalsSetting() {
        NewsSlackMessageBuilder solo = new NewsSlackMessageBuilder(NewsFixtures.properties(false, "", 40, 0.6, 1),
                JsonMapper.builder().build());
        NewsCandidate pushTarget = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true);

        String text = text(solo.build(finished(false, true, List.of(pushTarget))));

        assertThat(text).contains("*승인 0/1*").contains("서로 다른 1명이 [승인]을 누르면 승인됩니다");
    }

    @Test
    @DisplayName("발송 중·발송 완료·발송 실패 상태를 보여주고, 발송 실패를 수집 실패로 착각하지 않는다")
    void showsSendingStates() {
        NewsCandidate pushTarget = candidate(NewsSection.KOREA_STORE, NewsKind.RELEASE, "입고", null, null, "https://x.com/a/status/1", true);
        NewsBatch sending = scheduledBatch();
        sending.startSending(serverTime(2026, 11, 13, 8, 1));
        NewsBatch sent = scheduledBatch();
        sent.startSending(serverTime(2026, 11, 13, 8, 1));
        sent.finishSending(true);
        NewsBatch failed = scheduledBatch();
        failed.startSending(serverTime(2026, 11, 13, 8, 1));
        failed.finishSending(false);

        BatchView failedView = new BatchView(failed, List.of(pushTarget), List.of("U1", "U2"), Set.of());

        assertThat(text(builder.render(new BatchView(sending, List.of(pushTarget), List.of("U1", "U2"), Set.of()))))
                .contains("✅ *승인됨* · <@U1>, <@U2> · 📤 발송 중");
        assertThat(text(builder.render(new BatchView(sent, List.of(pushTarget), List.of("U1", "U2"), Set.of()))))
                .contains("📨 발송 완료 11/13(금) 08:01");
        assertThat(text(builder.render(failedView))).contains("❌ 발송 상태 확인 필요 (재발송 안 함)");
        assertThat(builder.summary(failedView)).startsWith("목요일 수집 완료 · ").doesNotContain("수집 실패");
        List.of(sending, sent, failed).forEach(batch -> builder.render(new BatchView(batch, List.of(pushTarget), List.of(), Set.of()))
                .blocks().forEach(block -> assertThat(block.path("type").asString()).isNotEqualTo("actions")));
    }

    /**
     * 시각 컬럼은 서버 기본 시간대로 저장하고 슬랙에는 news.zone(KST)으로 바꿔 보여준다. 서버 시간대가 KST 가 아니어도(CI 는 UTC)
     * 같은 결과가 나오도록, KST 기준 시각을 서버 시간대의 값으로 바꿔서 넣는다.
     */
    private static LocalDateTime serverTime(final int year, final int month, final int day, final int hour, final int minute) {
        return LocalDateTime.of(year, month, day, hour, minute).atZone(ZoneId.of("Asia/Seoul"))
                .withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }

    private NewsBatch scheduledBatch() {
        NewsBatch batch = batch(false);
        batch.complete(Set.of("chiikawashop_kr", "chiikawa_kouhou"), true, USAGE, List.of());
        batch.approve(LocalDateTime.of(2026, 11, 12, 22, 0), serverTime(2026, 11, 13, 8, 0));
        return batch;
    }

    private BatchView view(final NewsRunResult.Finished result) {
        return new BatchView(result.batch(), result.candidates(), List.of(), Set.of());
    }

    private NewsRunResult.Finished finished(final boolean dryRun, final boolean collected, final List<NewsCandidate> candidates) {
        NewsBatch batch = batch(dryRun);
        batch.complete(collected ? Set.of("chiikawashop_kr", "chiikawa_kouhou") : Set.of(), true, USAGE, List.of());
        return new NewsRunResult.Finished(batch, candidates, null);
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
