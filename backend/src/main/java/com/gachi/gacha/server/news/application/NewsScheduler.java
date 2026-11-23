package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.infra.NewsConfig;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.SlackClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 신상 소식 정기 수집. 월요일은 한국 계정, 목요일은 한국·일본 계정을 수집한다(계정은 주제별 runs 설정).
 * 수집은 몇 분이 걸려서 스케줄러 스레드(기본 1개)를 붙잡지 않도록 신상 소식 전용 실행기에서 돈다.
 * 수집이 끝나면 성공·실패와 상관없이 슬랙에 실행 보고를 보낸다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class NewsScheduler {

    static final String MONDAY = "MONDAY";
    static final String THURSDAY = "THURSDAY";

    private final NewsCollectService collectService;
    private final NewsBatchService batchService;
    private final NewsSlackMessageBuilder messageBuilder;
    private final SlackClient slackClient;
    private final NewsProperties properties;

    @Async(NewsConfig.EXECUTOR_NAME)
    @Scheduled(cron = "${news.schedule.monday-cron}", zone = "${news.zone}")
    public void collectMonday() {
        collectAll(MONDAY);
    }

    @Async(NewsConfig.EXECUTOR_NAME)
    @Scheduled(cron = "${news.schedule.thursday-cron}", zone = "${news.zone}")
    public void collectThursday() {
        collectAll(THURSDAY);
    }

    /**
     * 그 일정이 있는 주제를 차례로 수집한다. 한 주제가 실패해도 다음 주제는 수집한다.
     */
    private void collectAll(final String runName) {
        properties.topics().forEach((topic, config) -> {
            if (!config.runs().containsKey(runName)) {
                return;
            }
            try {
                report(collectService.collect(topic, runName));
            } catch (RuntimeException e) {
                log.error("신상 소식 정기 수집 실패. topic = {}, run = {}", topic, runName, e);
            }
        });
    }

    /**
     * 실행 보고를 보내고, 받은 메시지 ts 를 회차에 기록한다. 슬랙 호출이 실패해도 수집은 이미 끝났으므로 로그만 남긴다.
     */
    private void report(final NewsRunResult result) {
        try {
            String channel = properties.slack().channelId() == null ? "" : properties.slack().channelId();
            switch (result) {
                case NewsRunResult.Skipped skipped -> slackClient.postMessage(channel, messageBuilder.skipped(skipped));
                case NewsRunResult.Finished finished -> {
                    String messageTs = slackClient.postMessage(channel, messageBuilder.build(finished));
                    if (messageTs != null) {
                        batchService.recordSlackMessage(finished.batch().getId(), channel, messageTs);
                    }
                }
            }
        } catch (RuntimeException e) {
            log.error("신상 소식 실행 보고를 슬랙에 보내지 못했다. topic = {}, run = {} : {}",
                    result.topic(), result.runName(), e.getMessage(), e);
        }
    }
}
