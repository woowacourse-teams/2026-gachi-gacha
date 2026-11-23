package com.gachi.gacha.server.news.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.infra.SlackClient;
import com.gachi.gacha.server.news.infra.SlackClient.SlackMessage;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

class NewsSchedulerTest {

    private static final String CHANNEL = "C0NEWS";

    private final NewsCollectService collectService = mock(NewsCollectService.class);
    private final NewsBatchService batchService = mock(NewsBatchService.class);
    private final NewsSlackMessageBuilder messageBuilder = mock(NewsSlackMessageBuilder.class);
    private final SlackClient slackClient = mock(SlackClient.class);
    private final SlackMessage message = new SlackMessage("치이카와 신상 소식", JsonMapper.builder().build().createArrayNode());
    private final NewsScheduler scheduler = new NewsScheduler(collectService, batchService, messageBuilder, slackClient,
            NewsFixtures.properties(false, "", 40, 0.6));

    @Test
    @DisplayName("목요일 일정이 있는 주제를 수집하고, 끝나면 실행 보고를 보내 받은 ts 를 회차에 기록한다")
    void collectsThursdayAndReports() {
        NewsRunResult.Finished finished = finished();
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willReturn(finished);
        given(messageBuilder.build(finished)).willReturn(message);
        given(slackClient.postMessage(CHANNEL, message)).willReturn("2.2");

        scheduler.collectThursday();

        then(batchService).should().recordSlackMessage(7L, CHANNEL, "2.2");
    }

    @Test
    @DisplayName("건너뛴 수집은 한 줄 경고를 보내고, 회차가 없으니 기록은 하지 않는다")
    void reportsSkipped() {
        NewsRunResult.Skipped skipped = new NewsRunResult.Skipped("CHIIKAWA", "THURSDAY", "이미 수집 중인 회차가 있음");
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willReturn(skipped);
        given(messageBuilder.skipped(skipped)).willReturn(message);

        scheduler.collectThursday();

        then(slackClient).should().postMessage(CHANNEL, message);
        then(batchService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("봇 토큰이 없어 ts 가 없으면 기록하지 않는다 (로컬)")
    void doesNotRecordWithoutTs() {
        NewsRunResult.Finished finished = finished();
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willReturn(finished);
        given(messageBuilder.build(finished)).willReturn(message);
        given(slackClient.postMessage(CHANNEL, message)).willReturn(null);

        scheduler.collectThursday();

        then(batchService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("슬랙 호출이 실패해도 예외를 밖으로 던지지 않는다")
    void swallowsSlackFailure() {
        NewsRunResult.Finished finished = finished();
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willReturn(finished);
        given(messageBuilder.build(finished)).willReturn(message);
        willThrow(new SlackClient.SlackException("chat.postMessage 실패: channel_not_found"))
                .given(slackClient).postMessage(eq(CHANNEL), any());

        scheduler.collectThursday();

        then(batchService).should(never()).recordSlackMessage(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("월요일 일정이 없는 주제는 수집하지 않는다")
    void skipsTopicWithoutRun() {
        scheduler.collectMonday();

        then(collectService).should(never()).collect("CHIIKAWA", "MONDAY");
        then(slackClient).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("수집이 예외로 끝나도 스케줄러 밖으로 던지지 않는다")
    void swallowsCollectFailure() {
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willThrow(new IllegalStateException("db down"));

        scheduler.collectThursday();

        then(slackClient).shouldHaveNoInteractions();
    }

    private NewsRunResult.Finished finished() {
        NewsBatch batch = NewsBatch.start("CHIIKAWA", "THURSDAY", List.of(CollectPeriod.notCollected(
                "chiikawashop_kr", LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 12))), false, "chiikawa-v2");
        ReflectionTestUtils.setField(batch, "id", 7L);
        return new NewsRunResult.Finished(batch, List.of(), NewsRunResult.Stats.NONE);
    }
}
