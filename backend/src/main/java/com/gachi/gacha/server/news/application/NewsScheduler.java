package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.infra.NewsConfig;
import com.gachi.gacha.server.news.infra.NewsProperties;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 신상 소식 수집을 실행한다. 월요일은 한국 계정, 목요일은 한국·일본 계정을 수집하고(계정은 주제별 runs 설정),
 * [다시 수집]도 같은 방식으로 돈다. 수집은 몇 분이 걸려서 스케줄러 스레드(기본 1개)를 붙잡지 않도록
 * 신상 소식 전용 실행기에서 돌고, 이 실행기는 스레드가 1개라 수집끼리 겹치지 않고 차례로 돈다.
 * 수집이 끝나면 성공·실패와 상관없이 슬랙에 보고한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class NewsScheduler {

    static final String MONDAY = "MONDAY";
    static final String THURSDAY = "THURSDAY";

    private final NewsCollectService collectService;
    private final NewsSlackReporter reporter;
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
     * [다시 수집]. 버린 회차와 같은 계정을 같은 기간으로 다시 수집하고 새 승인 요청을 보낸다.
     */
    @Async(NewsConfig.EXECUTOR_NAME)
    public void recollect(final String topic, final List<String> handles) {
        try {
            reporter.postReport(collectService.recollect(topic, handles));
        } catch (RuntimeException e) {
            log.error("신상 소식 다시 수집 실패. topic = {}", topic, e);
        }
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
                reporter.postReport(collectService.collect(topic, runName));
            } catch (RuntimeException e) {
                log.error("신상 소식 정기 수집 실패. topic = {}, run = {}", topic, runName, e);
            }
        });
    }
}
