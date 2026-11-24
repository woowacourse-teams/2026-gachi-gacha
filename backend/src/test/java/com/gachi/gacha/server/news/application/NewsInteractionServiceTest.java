package com.gachi.gacha.server.news.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.gachi.gacha.server.news.application.NewsApprovalService.Discarded;
import com.gachi.gacha.server.news.application.NewsApprovalService.Result;
import com.gachi.gacha.server.news.application.NewsApprovalService.Vote;
import com.gachi.gacha.server.news.application.NewsApprovalService.VoteStatus;
import com.gachi.gacha.server.news.application.dto.SlackInteraction;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.infra.SlackClient;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class NewsInteractionServiceTest {

    private static final String CHANNEL = "C0NEWS";
    private static final String APPROVER = "U_APPROVER";

    private final SlackClient slackClient = mock(SlackClient.class);
    private final NewsApprovalService approvalService = mock(NewsApprovalService.class);
    private final NewsSlackReporter reporter = mock(NewsSlackReporter.class);
    private final NewsScheduler scheduler = mock(NewsScheduler.class);
    private final NewsPushService pushService = mock(NewsPushService.class);
    private final NewsInteractionService service = new NewsInteractionService(slackClient, approvalService, reporter,
            scheduler, pushService, NewsFixtures.properties(false, "", 40, 0.6));

    @Test
    @DisplayName("승인자가 아닌 사람이 누르면 아무것도 바꾸지 않고, 그 사람에게만 보이는 안내를 남긴다")
    void rejectsNonApprover() {
        service.handle(interaction("U_STRANGER", "news_approve", "7"));

        then(slackClient).should().postEphemeral(CHANNEL, "U_STRANGER", NewsInteractionService.NOT_APPROVER_MESSAGE);
        then(approvalService).shouldHaveNoInteractions();
        then(reporter).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("슬랙 호출이 실패해도 예외를 밖으로 던지지 않는다")
    void swallowsSlackFailure() {
        willThrow(new SlackClient.SlackException("chat.postEphemeral 실패: channel_not_found"))
                .given(slackClient).postEphemeral(anyString(), anyString(), any());

        service.handle(interaction("U_STRANGER", "news_approve", "7"));

        then(slackClient).should(never()).postMessage(any(), any());
    }

    @Test
    @DisplayName("버튼 값이 올바르지 않으면 아무것도 바꾸지 않고 안내만 남긴다")
    void rejectsInvalidButtonValue() {
        service.handle(interaction(APPROVER, "news_approve", "abc"));
        service.handle(interaction(APPROVER, "news_exclude", "7"));
        service.handle(interaction(APPROVER, "news_approve", null));

        then(slackClient).should(org.mockito.Mockito.times(3)).postEphemeral(CHANNEL, APPROVER, NewsInteractionService.INVALID_BUTTON_MESSAGE);
        then(approvalService).shouldHaveNoInteractions();
    }

    @Nested
    @DisplayName("제외·되돌리기")
    class Exclusion {

        @Test
        @DisplayName("제외하면 회차 메시지를 다시 그린다")
        void excludeRedraws() {
            given(approvalService.exclude(7L, 11L, APPROVER)).willReturn(Result.DONE);

            service.handle(interaction(APPROVER, "news_exclude", "7:11"));

            then(reporter).should().refresh(7L);
        }

        @Test
        @DisplayName("되돌리기는 제외 기록을 지우고 메시지를 다시 그린다")
        void undoRedraws() {
            given(approvalService.undoExclusion(7L, 11L, APPROVER)).willReturn(Result.DONE);

            service.handle(interaction(APPROVER, "news_undo_exclude", "7:11"));

            then(reporter).should().refresh(7L);
        }

        @Test
        @DisplayName("이미 승인되었거나 만료된 회차면 바꾸지 않고 그 사람에게만 안내한다")
        void closedBatch() {
            given(approvalService.exclude(7L, 11L, APPROVER)).willReturn(Result.NOT_AWAITING);

            service.handle(interaction(APPROVER, "news_exclude", "7:11"));

            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.CLOSED_MESSAGE);
            then(reporter).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("승인")
    class Approval {

        @Test
        @DisplayName("첫 표는 진행 상황을 본인에게 알리고 메시지의 승인 진행 표시를 바꾼다")
        void firstVote() {
            given(approvalService.approve(7L, APPROVER)).willReturn(new Vote(VoteStatus.VOTED, 1));

            service.handle(interaction(APPROVER, "news_approve", "7"));

            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, "승인했습니다 (1/2). 서로 다른 2명이 승인하면 공개됩니다.");
            then(reporter).should().refresh(7L);
        }

        @Test
        @DisplayName("같은 사람이 다시 누르면 이미 승인했다고만 알린다")
        void alreadyVoted() {
            given(approvalService.approve(7L, APPROVER)).willReturn(new Vote(VoteStatus.ALREADY_VOTED, 1));

            service.handle(interaction(APPROVER, "news_approve", "7"));

            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, "이미 승인하셨습니다 (1/2).");
            then(reporter).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("표가 모여 승인되면 메시지를 승인됨으로 다시 그린다")
        void approved() {
            given(approvalService.approve(7L, APPROVER)).willReturn(new Vote(VoteStatus.APPROVED, 2));

            service.handle(interaction(APPROVER, "news_approve", "7"));

            then(reporter).should().refresh(7L);
        }

        @Test
        @DisplayName("이미 끝난 회차에 누르면 안내만 한다")
        void closedBatch() {
            given(approvalService.approve(7L, APPROVER)).willReturn(new Vote(VoteStatus.NOT_AWAITING, 0));

            service.handle(interaction(APPROVER, "news_approve", "7"));

            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.CLOSED_MESSAGE);
        }
    }

    @Nested
    @DisplayName("다시 수집")
    class Recollect {

        @Test
        @DisplayName("회차를 버리고, 메시지를 다시 그리고, 수집을 신상 소식 실행기에 넘긴다")
        void discardsAndRecollects() {
            given(approvalService.discard(7L)).willReturn(Optional.of(new Discarded("CHIIKAWA", List.of("chiikawashop_kr"))));

            service.handle(interaction(APPROVER, "news_recollect", "7"));

            then(reporter).should().refresh(7L);
            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.RECOLLECT_STARTED_MESSAGE);
            then(scheduler).should().recollect("CHIIKAWA", List.of("chiikawashop_kr"));
        }

        @Test
        @DisplayName("이미 승인되었거나 만료된 회차는 다시 수집하지 않는다")
        void closedBatch() {
            given(approvalService.discard(anyLong())).willReturn(Optional.empty());

            service.handle(interaction(APPROVER, "news_recollect", "7"));

            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.CLOSED_MESSAGE);
            then(scheduler).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("나에게 테스트 발송")
    class TestSendButton {

        @Test
        @DisplayName("누른 승인자의 가치가챠 회원 ID 로 테스트 발송을 하고, 결과는 스레드에 남긴다고 안내한다")
        void sendsToApproverMember() {
            given(pushService.sendTest(7L, 12L, APPROVER)).willReturn(NewsPushService.TestSend.DONE);

            service.handle(interaction(APPROVER, "news_test_send", "7"));

            then(pushService).should().sendTest(7L, 12L, APPROVER);
            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.TEST_SEND_STARTED_MESSAGE);
        }

        @Test
        @DisplayName("승인 대기가 아니거나 없는 회차면 안내만 한다")
        void closedOrMissing() {
            given(pushService.sendTest(7L, 12L, APPROVER)).willReturn(NewsPushService.TestSend.CLOSED);
            given(pushService.sendTest(8L, 12L, APPROVER)).willReturn(NewsPushService.TestSend.NOT_FOUND);

            service.handle(interaction(APPROVER, "news_test_send", "7"));
            service.handle(interaction(APPROVER, "news_test_send", "8"));

            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.CLOSED_MESSAGE);
            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.NOT_FOUND_MESSAGE);
        }

        @Test
        @DisplayName("버튼 값이 올바르지 않으면 보내지 않는다")
        void invalidValue() {
            service.handle(interaction(APPROVER, "news_test_send", "abc"));

            then(pushService).shouldHaveNoInteractions();
            then(slackClient).should().postEphemeral(CHANNEL, APPROVER, NewsInteractionService.INVALID_BUTTON_MESSAGE);
        }
    }

    private SlackInteraction interaction(final String userId, final String actionId, final String value) {
        return new SlackInteraction(userId, "tester", CHANNEL, "1731382200.000100",
                List.of(new SlackInteraction.Action(actionId, value)));
    }
}
