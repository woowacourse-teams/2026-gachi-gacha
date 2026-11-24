package com.gachi.gacha.server.news.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.gachi.gacha.server.news.application.dto.BatchView;
import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.infra.SlackClient;
import com.gachi.gacha.server.news.infra.SlackClient.SlackMessage;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

class NewsSlackReporterTest {

    private static final String CHANNEL = "C0NEWS";

    private final NewsBatchService batchService = mock(NewsBatchService.class);
    private final NewsApprovalService approvalService = mock(NewsApprovalService.class);
    private final NewsSlackMessageBuilder messageBuilder = mock(NewsSlackMessageBuilder.class);
    private final SlackClient slackClient = mock(SlackClient.class);
    private final SlackMessage message = new SlackMessage("치이카와 신상 소식", JsonMapper.builder().build().createArrayNode());
    private final NewsSlackReporter reporter = new NewsSlackReporter(slackClient, messageBuilder, batchService,
            approvalService, NewsFixtures.properties(false, "", 40, 0.6));

    @Test
    @DisplayName("수집 결과를 새 메시지로 보내고, 받은 ts 를 회차에 기록한다")
    void postsReportAndRecordsTs() {
        NewsRunResult.Finished finished = finished(7L);
        given(messageBuilder.build(finished)).willReturn(message);
        given(slackClient.postMessage(CHANNEL, message)).willReturn("2.2");

        reporter.postReport(finished);

        then(batchService).should().recordSlackMessage(7L, CHANNEL, "2.2");
    }

    @Test
    @DisplayName("건너뛴 수집은 한 줄 경고를 보내고, 회차가 없으니 기록은 하지 않는다")
    void reportsSkipped() {
        NewsRunResult.Skipped skipped = new NewsRunResult.Skipped("CHIIKAWA", "THURSDAY", "이미 수집 중인 회차가 있음");
        given(messageBuilder.skipped(skipped)).willReturn(message);

        reporter.postReport(skipped);

        then(slackClient).should().postMessage(CHANNEL, message);
        then(batchService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("봇 토큰이 없어 ts 가 없으면 기록하지 않는다 (로컬)")
    void doesNotRecordWithoutTs() {
        NewsRunResult.Finished finished = finished(7L);
        given(messageBuilder.build(finished)).willReturn(message);
        given(slackClient.postMessage(CHANNEL, message)).willReturn(null);

        reporter.postReport(finished);

        then(batchService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("슬랙 호출이 실패해도 예외를 밖으로 던지지 않는다")
    void swallowsSlackFailure() {
        NewsRunResult.Finished finished = finished(7L);
        given(messageBuilder.build(finished)).willReturn(message);
        willThrow(new SlackClient.SlackException("chat.postMessage 실패: channel_not_found"))
                .given(slackClient).postMessage(eq(CHANNEL), any());

        reporter.postReport(finished);

        then(batchService).should(never()).recordSlackMessage(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("이 수집이 만료시킨 이전 회차의 메시지는 '만료됨 · N건 이월'로 다시 그린다")
    void updatesExpiredMessage() {
        NewsRunResult.Finished finished = finished(8L).withExpired(new NewsRunResult.Expired(7L, 2));
        NewsBatch previous = batch(7L);
        previous.recordSlackMessage(CHANNEL, "1.1");
        BatchView view = new BatchView(previous, List.of(), List.of(), Set.of());
        given(messageBuilder.build(finished)).willReturn(message);
        given(slackClient.postMessage(CHANNEL, message)).willReturn("2.2");
        given(approvalService.view(7L)).willReturn(Optional.of(view));
        SlackMessage expiredMessage = new SlackMessage("만료됨", JsonMapper.builder().build().createArrayNode());
        given(messageBuilder.renderExpired(view, 2)).willReturn(expiredMessage);

        reporter.postReport(finished);

        then(slackClient).should().updateMessage(CHANNEL, "1.1", expiredMessage);
    }

    @Test
    @DisplayName("새 메시지를 보내지 못해도 만료된 이전 회차의 메시지는 다시 그린다")
    void updatesExpiredMessageEvenWhenPostFails() {
        NewsRunResult.Finished finished = finished(8L).withExpired(new NewsRunResult.Expired(7L, 0));
        NewsBatch previous = batch(7L);
        previous.recordSlackMessage(CHANNEL, "1.1");
        BatchView view = new BatchView(previous, List.of(), List.of(), Set.of());
        given(messageBuilder.build(finished)).willReturn(message);
        willThrow(new SlackClient.SlackException("chat.postMessage 실패: ratelimited"))
                .given(slackClient).postMessage(eq(CHANNEL), any());
        given(approvalService.view(7L)).willReturn(Optional.of(view));
        given(messageBuilder.renderExpired(view, 0)).willReturn(message);

        reporter.postReport(finished);

        then(slackClient).should().updateMessage(CHANNEL, "1.1", message);
    }

    @Test
    @DisplayName("회차의 현재 상태로 기존 메시지를 다시 그린다")
    void refreshRedrawsMessage() {
        NewsBatch current = batch(7L);
        current.recordSlackMessage(CHANNEL, "1.1");
        BatchView view = new BatchView(current, List.of(), List.of("U1"), Set.of());
        given(approvalService.view(7L)).willReturn(Optional.of(view));
        given(messageBuilder.render(view)).willReturn(message);

        reporter.refresh(7L);

        then(slackClient).should().updateMessage(CHANNEL, "1.1", message);
    }

    @Test
    @DisplayName("메시지를 알린 적 없는 회차(로컬, 슬랙 실패)는 다시 그리지 않고, 다시 그리기가 실패해도 던지지 않는다")
    void refreshSkipsWithoutMessageAndSwallowsFailure() {
        BatchView withoutMessage = new BatchView(batch(7L), List.of(), List.of(), Set.of());
        given(approvalService.view(7L)).willReturn(Optional.of(withoutMessage));
        reporter.refresh(7L);
        then(slackClient).shouldHaveNoInteractions();

        NewsBatch current = batch(8L);
        current.recordSlackMessage(CHANNEL, "1.1");
        BatchView view = new BatchView(current, List.of(), List.of(), Set.of());
        given(approvalService.view(8L)).willReturn(Optional.of(view));
        given(messageBuilder.render(view)).willReturn(message);
        willThrow(new SlackClient.SlackException("chat.update 실패: message_not_found"))
                .given(slackClient).updateMessage(anyString(), anyString(), any());

        reporter.refresh(8L);

        assertThat(current.getSlackMessageTs()).isEqualTo("1.1");
    }

    private NewsRunResult.Finished finished(final Long id) {
        return new NewsRunResult.Finished(batch(id), List.of(), null);
    }

    private NewsBatch batch(final Long id) {
        NewsBatch batch = NewsBatch.start("CHIIKAWA", "THURSDAY", List.of(CollectPeriod.notCollected(
                "chiikawashop_kr", LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 12))), false, "chiikawa-v2");
        ReflectionTestUtils.setField(batch, "id", id);
        return batch;
    }
}
