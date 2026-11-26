package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

import com.gachi.gacha.server.news.application.dto.BatchView;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsMemberTopicJpaRepository;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsSendPolicy;
import com.gachi.gacha.server.news.application.NewsPushService.TestSend;
import com.gachi.gacha.server.notification.application.PushMessage;
import com.gachi.gacha.server.notification.application.PushResult;
import com.gachi.gacha.server.notification.application.PushSender;
import com.gachi.gacha.server.notification.application.PushTokenService;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class NewsPushServiceTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String TOPIC = "CHIIKAWA";
    private static final LocalDate FUTURE = LocalDate.of(2099, 1, 1);

    private final NewsApprovalService approvalService = mock(NewsApprovalService.class);
    private final NewsSlackReporter reporter = mock(NewsSlackReporter.class);
    private final NewsItemJpaRepository itemRepository = mock(NewsItemJpaRepository.class);
    private final NewsMemberTopicJpaRepository memberTopicRepository = mock(NewsMemberTopicJpaRepository.class);
    private final PushTokenJpaRepository pushTokenRepository = mock(PushTokenJpaRepository.class);
    private final PushTokenService pushTokenService = mock(PushTokenService.class);
    private final PushSender pushSender = mock(PushSender.class);
    private final NewsSendPolicy sendPolicy = new NewsSendPolicy(KST, LocalTime.of(8, 0), LocalTime.of(21, 0), 1, 3);

    private NewsPushService serviceAt(final String kstTime) {
        Clock clock = Clock.fixed(LocalDateTime.parse(kstTime).atZone(KST).toInstant(), KST);
        return new NewsPushService(approvalService, reporter, itemRepository, memberTopicRepository, pushTokenRepository,
                pushTokenService, pushSender, sendPolicy, NewsFixtures.properties(false, "", 40, 0.6), clock);
    }

    @Nested
    @DisplayName("발송 시각이 지난 회차 보내기")
    class SendDue {

        @Test
        @DisplayName("허용 시간 안이면 발송 중으로 표시한 뒤 구독자의 모든 기기로 보내고, 결과를 기록하고 스레드에 남긴다")
        void sendsToSubscribers() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            prepareDue(7L);
            givenSubscribers(List.of(1L, 2L), List.of(token(1L, "t1"), token(1L, "t2"), token(2L, "t3"), token(2L, "t1")));
            given(pushSender.sendWithResult(anyList(), any())).willReturn(new PushResult(2, 1, 0, List.of("t3")));

            service.sendDue();

            ArgumentCaptor<List<String>> tokens = ArgumentCaptor.captor();
            ArgumentCaptor<PushMessage> message = ArgumentCaptor.forClass(PushMessage.class);
            then(approvalService).should().claimForSending(eq(7L), any());
            then(pushSender).should(times(1)).sendWithResult(tokens.capture(), message.capture());
            assertThat(tokens.getValue()).containsExactly("t1", "t2", "t3");
            assertThat(message.getValue().title()).isEqualTo("치이카와 신상 소식");
            assertThat(message.getValue().body()).isEqualTo("[발매 1/1(목)~] 푸시 소식");
            assertThat(message.getValue().data()).containsEntry("type", "NEWS").containsEntry("topic", "CHIIKAWA");
            assertThat(message.getValue().collapseKey()).isEqualTo("news-CHIIKAWA");
            then(pushTokenService).should().deleteInvalidTokens(List.of("t3"));
            then(approvalService).should().finishSending(7L, true);
            then(reporter).should().refresh(7L);
            ArgumentCaptor<String> reply = ArgumentCaptor.forClass(String.class);
            then(reporter).should().replyInThread(eq(7L), reply.capture());
            assertThat(reply.getValue()).startsWith("발송 완료 · 구독자 2명 · 기기 3대 중 성공 2 / 실패 1 · 무효 토큰 1개 정리")
                    .contains("내용: 치이카와 신상 소식 / [발매").contains("기기에 도착했다는 뜻은 아닙니다");
        }

        @Test
        @DisplayName("다른 곳이 이미 가져간 회차는 보내지 않는다 (같은 회차를 두 번 보내지 않는다)")
        void doesNotSendWhenNotClaimed() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findDueForSending(any())).willReturn(List.of(7L));
            given(approvalService.claimForSending(eq(7L), any())).willReturn(false);

            service.sendDue();

            then(pushSender).shouldHaveNoInteractions();
            then(approvalService).should(never()).finishSending(anyLong(), anyBoolean());
        }

        @Test
        @DisplayName("보낼 회차가 없으면 아무것도 하지 않는다")
        void nothingDue() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findDueForSending(any())).willReturn(List.of());

            service.sendDue();

            then(approvalService).should(never()).claimForSending(anyLong(), any());
            then(pushSender).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("허용 시간(08:00~21:00) 밖이면 보내지 않고 다음 발송 가능 시각으로 미룬다 (07:59, 21:00 은 밖이다)")
        void postponesOutsideWindow() {
            for (String time : List.of("2026-11-25T07:59:00", "2026-11-25T21:00:00", "2026-11-25T23:30:00")) {
                given(approvalService.findDueForSending(any())).willReturn(List.of(7L));

                serviceAt(time).sendDue();
            }

            then(approvalService).should(times(3)).postpone(7L);
            then(approvalService).should(never()).claimForSending(anyLong(), any());
            then(pushSender).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("허용 시간 안의 경계(08:00, 20:59)에는 보낸다")
        void sendsAtWindowEdges() {
            for (String time : List.of("2026-11-25T08:00:00", "2026-11-25T20:59:00")) {
                prepareDue(7L);
                givenSubscribers(List.of(1L), List.of(token(1L, "t1")));
                given(pushSender.sendWithResult(anyList(), any())).willReturn(new PushResult(1, 0, 0, List.of()));

                serviceAt(time).sendDue();
            }

            then(pushSender).should(times(2)).sendWithResult(anyList(), any());
            then(approvalService).should(never()).postpone(anyLong());
        }

        @Test
        @DisplayName("FCM 호출이 일부 알 수 없음으로 끝나면 실패로 기록하고 다시 보내지 않는다")
        void unknownResultMarksFailedWithoutResend() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            prepareDue(7L);
            givenSubscribers(List.of(1L), List.of(token(1L, "t1"), token(1L, "t2")));
            given(pushSender.sendWithResult(anyList(), any())).willReturn(new PushResult(1, 0, 1, List.of()));

            service.sendDue();

            then(pushSender).should(times(1)).sendWithResult(anyList(), any());
            then(approvalService).should().finishSending(7L, false);
            ArgumentCaptor<String> reply = ArgumentCaptor.forClass(String.class);
            then(reporter).should().replyInThread(eq(7L), reply.capture());
            assertThat(reply.getValue()).startsWith("발송 상태 확인 필요 (재발송 안 함) · 구독자 1명 · 기기 2대 중 성공 1 / 실패 0 / 받아들여졌는지 알 수 없음 1");
        }

        @Test
        @DisplayName("발송 중 예외가 나도 실패로 기록하고 다시 보내지 않는다")
        void exceptionMarksFailedWithoutResend() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            prepareDue(7L);
            givenSubscribers(List.of(1L), List.of(token(1L, "t1")));
            given(pushSender.sendWithResult(anyList(), any())).willThrow(new IllegalStateException("fcm down"));

            service.sendDue();

            then(pushSender).should(times(1)).sendWithResult(anyList(), any());
            then(approvalService).should().finishSending(7L, false);
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.contains("재발송 안 함"));
        }

        @Test
        @DisplayName("구독자나 기기가 없으면 FCM 을 부르지 않고 발송 완료로 끝낸다")
        void noRecipients() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            prepareDue(7L);
            given(memberTopicRepository.findSubscribedMemberIds(TOPIC)).willReturn(List.of());

            service.sendDue();

            then(pushSender).shouldHaveNoInteractions();
            then(approvalService).should().finishSending(7L, true);
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.startsWith("발송 완료 · 구독자 0명 · 기기 0대"));
        }

        @Test
        @DisplayName("푸시가 비활성인 환경(모든 수가 0)에서는 실제로 보내지 않았다고 알린다")
        void pushDisabled() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            prepareDue(7L);
            givenSubscribers(List.of(1L), List.of(token(1L, "t1")));
            given(pushSender.sendWithResult(anyList(), any())).willReturn(PushResult.NONE);

            service.sendDue();

            then(approvalService).should().finishSending(7L, true);
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.startsWith("푸시가 비활성(firebase.push-enabled=false)이라 실제로 보내지 않았습니다"));
        }

        @Test
        @DisplayName("보낼 소식이 모두 끝났으면 FCM 을 부르지 않고 그렇게 알린다")
        void allEnded() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findDueForSending(any())).willReturn(List.of(7L));
            given(approvalService.claimForSending(eq(7L), any())).willReturn(true);
            given(approvalService.view(7L)).willReturn(Optional.of(view(batch(7L), List.of())));
            NewsCandidate ended = candidate(NewsSection.KOREA_STORE, "끝난 소식", LocalDate.of(2020, 1, 1), LocalDate.of(2020, 1, 2), 1L);
            given(itemRepository.findAllByBatchId(7L)).willReturn(List.of(NewsItem.publish(TOPIC, ended, LocalDateTime.now())));

            service.sendDue();

            then(pushSender).shouldHaveNoInteractions();
            then(approvalService).should().finishSending(7L, true);
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.contains("푸시를 보내지 않았습니다"));
        }

        @Test
        @DisplayName("탭에만 공개하는 소식은 푸시에 넣지 않는다")
        void tabOnlyItemsAreNotPushed() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findDueForSending(any())).willReturn(List.of(7L));
            given(approvalService.claimForSending(eq(7L), any())).willReturn(true);
            given(approvalService.view(7L)).willReturn(Optional.of(view(batch(7L), List.of())));
            NewsCandidate push = candidate(NewsSection.KOREA_STORE, "푸시 소식", FUTURE, null, 1L);
            NewsCandidate tabOnly = candidate(NewsSection.OTHER_GOODS, "탭만 소식", FUTURE.minusYears(1), null, 2L);
            given(itemRepository.findAllByBatchId(7L)).willReturn(List.of(
                    NewsItem.publish(TOPIC, push, LocalDateTime.now()), NewsItem.publish(TOPIC, tabOnly, LocalDateTime.now())));
            givenSubscribers(List.of(1L), List.of(token(1L, "t1")));
            given(pushSender.sendWithResult(anyList(), any())).willReturn(new PushResult(1, 0, 0, List.of()));

            service.sendDue();

            ArgumentCaptor<PushMessage> message = ArgumentCaptor.forClass(PushMessage.class);
            then(pushSender).should().sendWithResult(anyList(), message.capture());
            assertThat(message.getValue().body()).endsWith("푸시 소식").doesNotContain("외 ");
        }

        @Test
        @DisplayName("한 회차의 처리가 예외로 끝나도 다음 회차는 계속 처리한다")
        void oneFailureDoesNotStopOthers() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findDueForSending(any())).willReturn(List.of(7L, 8L));
            given(approvalService.claimForSending(eq(7L), any())).willThrow(new IllegalStateException("db down"));
            given(approvalService.claimForSending(eq(8L), any())).willReturn(false);

            service.sendDue();

            then(approvalService).should().claimForSending(eq(8L), any());
        }
    }

    @Nested
    @DisplayName("발송 중으로 오래 남은 회차")
    class StuckSending {

        @Test
        @DisplayName("다시 보내지 않고 실패로 정리한 뒤 슬랙으로 '발송 상태 확인 필요 (재발송 안 함)'을 경고한다")
        void warnsWithoutResend() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findStuckSending(any())).willReturn(List.of(7L));
            given(approvalService.failStuckSending(7L)).willReturn(Optional.of(batch(7L)));
            given(approvalService.findDueForSending(any())).willReturn(List.of());

            service.sendDue();

            ArgumentCaptor<LocalDateTime> before = ArgumentCaptor.forClass(LocalDateTime.class);
            then(approvalService).should().findStuckSending(before.capture());
            assertThat(before.getValue()).isEqualTo(LocalDateTime.parse("2026-11-25T09:30:00"));
            then(reporter).should().refresh(7L);
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.contains("발송 상태 확인 필요 (재발송 안 함)"));
            then(pushSender).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("다른 곳이 먼저 정리했으면 경고하지 않는다 (경고는 한 번만)")
        void warnsOnlyOnce() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.findStuckSending(any())).willReturn(List.of(7L));
            given(approvalService.failStuckSending(7L)).willReturn(Optional.empty());
            given(approvalService.findDueForSending(any())).willReturn(List.of());

            service.sendDue();

            then(reporter).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("나에게 테스트 발송")
    class SendTest {

        @Test
        @DisplayName("[테스트] 제목과 test=true 로 누른 사람의 기기에만 보내고, 회차 상태는 바꾸지 않으며, 허용 시간을 받지 않는다")
        void sendsToRequesterOnly() {
            NewsPushService service = serviceAt("2026-11-25T23:30:00");
            NewsCandidate push = candidate(NewsSection.KOREA_STORE, "푸시 소식", FUTURE, null, 1L);
            given(approvalService.view(7L)).willReturn(Optional.of(view(awaiting(7L), List.of(push))));
            given(pushTokenRepository.findAllByMemberId(12L)).willReturn(List.of(token(12L, "mine-1"), token(12L, "mine-2")));
            given(pushSender.sendWithResult(anyList(), any())).willReturn(new PushResult(2, 0, 0, List.of()));

            TestSend result = service.sendTest(7L, 12L, "U01TESTER");

            ArgumentCaptor<List<String>> tokens = ArgumentCaptor.captor();
            ArgumentCaptor<PushMessage> message = ArgumentCaptor.forClass(PushMessage.class);
            then(pushSender).should().sendWithResult(tokens.capture(), message.capture());
            assertThat(result).isEqualTo(TestSend.DONE);
            assertThat(tokens.getValue()).containsExactly("mine-1", "mine-2");
            assertThat(message.getValue().title()).isEqualTo("[테스트] 치이카와 신상 소식");
            assertThat(message.getValue().data()).containsEntry("test", "true");
            assertThat(message.getValue().collapseKey()).isNull();
            then(memberTopicRepository).shouldHaveNoInteractions();
            then(approvalService).should(never()).claimForSending(anyLong(), any());
            then(approvalService).should(never()).finishSending(anyLong(), anyBoolean());
            ArgumentCaptor<String> reply = ArgumentCaptor.forClass(String.class);
            then(reporter).should().replyInThread(eq(7L), reply.capture());
            assertThat(reply.getValue()).startsWith("테스트 발송 · <@U01TESTER> · 기기 2대 중 성공 2 / 실패 0 · 무효 토큰 0개 정리");
        }

        @Test
        @DisplayName("제외한 소식은 테스트 푸시에 넣지 않는다")
        void excludesExcluded() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            NewsCandidate kept = candidate(NewsSection.KOREA_STORE, "남긴 소식", FUTURE, null, 1L);
            NewsCandidate excluded = candidate(NewsSection.KOREA_STORE, "뺀 소식", FUTURE.minusYears(1), null, 2L);
            BatchView view = new BatchView(awaiting(7L), List.of(kept, excluded), List.of(), Set.of(excluded.linkKey()));
            given(approvalService.view(7L)).willReturn(Optional.of(view));
            given(pushTokenRepository.findAllByMemberId(12L)).willReturn(List.of(token(12L, "mine")));
            given(pushSender.sendWithResult(anyList(), any())).willReturn(new PushResult(1, 0, 0, List.of()));

            service.sendTest(7L, 12L, "U01TESTER");

            ArgumentCaptor<PushMessage> message = ArgumentCaptor.forClass(PushMessage.class);
            then(pushSender).should().sendWithResult(anyList(), message.capture());
            assertThat(message.getValue().body()).endsWith("남긴 소식").doesNotContain("외 ");
        }

        @Test
        @DisplayName("등록된 기기가 없으면 FCM 을 부르지 않고 그렇게 알린다")
        void noDevices() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.view(7L)).willReturn(Optional.of(view(awaiting(7L),
                    List.of(candidate(NewsSection.KOREA_STORE, "푸시 소식", FUTURE, null, 1L)))));
            given(pushTokenRepository.findAllByMemberId(12L)).willReturn(List.of());

            service.sendTest(7L, 12L, "U01TESTER");

            then(pushSender).shouldHaveNoInteractions();
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.contains("등록된 기기가 없어 보내지 않았습니다"));
        }

        @Test
        @DisplayName("푸시 대상이 없으면 보내지 않고 그렇게 알린다")
        void noTargets() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.view(7L)).willReturn(Optional.of(view(awaiting(7L), List.of())));

            TestSend result = service.sendTest(7L, 12L, "U01TESTER");

            assertThat(result).isEqualTo(TestSend.DONE);
            then(pushSender).shouldHaveNoInteractions();
            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.contains("보낼 푸시 대상이 없어"));
        }

        @Test
        @DisplayName("승인 대기가 아니거나 없는 회차는 보내지 않는다")
        void closedOrMissing() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            NewsBatch approved = awaiting(7L);
            approved.approve(LocalDateTime.now(), null);
            given(approvalService.view(7L)).willReturn(Optional.of(view(approved, List.of())));
            given(approvalService.view(8L)).willReturn(Optional.empty());

            assertThat(service.sendTest(7L, 12L, "U01TESTER")).isEqualTo(TestSend.CLOSED);
            assertThat(service.sendTest(8L, 12L, "U01TESTER")).isEqualTo(TestSend.NOT_FOUND);
            then(pushSender).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("발송 호출이 예외로 끝나도 던지지 않고 실패를 스레드에 남긴다")
        void failureIsReported() {
            NewsPushService service = serviceAt("2026-11-25T10:00:00");
            given(approvalService.view(7L)).willReturn(Optional.of(view(awaiting(7L),
                    List.of(candidate(NewsSection.KOREA_STORE, "푸시 소식", FUTURE, null, 1L)))));
            given(pushTokenRepository.findAllByMemberId(12L)).willReturn(List.of(token(12L, "mine")));
            given(pushSender.sendWithResult(anyList(), any())).willThrow(new IllegalStateException("fcm down"));

            assertThat(service.sendTest(7L, 12L, "U01TESTER")).isEqualTo(TestSend.DONE);

            then(reporter).should().replyInThread(eq(7L), org.mockito.ArgumentMatchers.startsWith("테스트 발송 실패"));
        }
    }

    private void prepareDue(final Long batchId) {
        given(approvalService.findDueForSending(any())).willReturn(List.of(batchId));
        given(approvalService.claimForSending(eq(batchId), any())).willReturn(true);
        given(approvalService.view(batchId)).willReturn(Optional.of(view(batch(batchId), List.of())));
        NewsCandidate push = candidate(NewsSection.KOREA_STORE, "푸시 소식", FUTURE, null, 1L);
        given(itemRepository.findAllByBatchId(batchId)).willReturn(List.of(NewsItem.publish(TOPIC, push, LocalDateTime.now())));
    }

    private void givenSubscribers(final List<Long> memberIds, final List<PushToken> tokens) {
        given(memberTopicRepository.findSubscribedMemberIds(TOPIC)).willReturn(memberIds);
        given(pushTokenRepository.findAllByMemberIdIn(memberIds)).willReturn(tokens);
    }

    private PushToken token(final Long memberId, final String value) {
        return PushToken.of(memberId, value, PushPlatform.ANDROID);
    }

    private BatchView view(final NewsBatch batch, final List<NewsCandidate> candidates) {
        return new BatchView(batch, candidates, List.of(), Set.of());
    }

    private NewsBatch batch(final Long id) {
        NewsBatch batch = NewsBatch.start(TOPIC, "THURSDAY", List.of(CollectPeriod.notCollected(
                "chiikawashop_kr", LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 12))), false, "chiikawa-v2.1");
        ReflectionTestUtils.setField(batch, "id", id);
        return batch;
    }

    private NewsBatch awaiting(final Long id) {
        NewsBatch batch = batch(id);
        batch.complete(Set.of("chiikawashop_kr"), true, GrokUsage.NONE, List.of());
        return batch;
    }

    private NewsCandidate candidate(final NewsSection section, final String title, final LocalDate start, final LocalDate end, final Long id) {
        NewsCandidate candidate = NewsCandidate.collected(1L, news(section, NewsKind.RELEASE, title, start, end,
                "https://x.com/a/status/" + (1000 + id), true, null));
        ReflectionTestUtils.setField(candidate, "id", id);
        return candidate;
    }
}
