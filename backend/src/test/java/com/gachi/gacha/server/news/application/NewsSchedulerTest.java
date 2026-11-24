package com.gachi.gacha.server.news.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsSchedulerTest {

    private final NewsCollectService collectService = mock(NewsCollectService.class);
    private final NewsSlackReporter reporter = mock(NewsSlackReporter.class);
    private final NewsScheduler scheduler = new NewsScheduler(collectService, reporter,
            NewsFixtures.properties(false, "", 40, 0.6));

    @Test
    @DisplayName("목요일 일정이 있는 주제를 수집하고, 끝나면 그 결과를 슬랙에 보고한다")
    void collectsThursdayAndReports() {
        NewsRunResult.Skipped result = new NewsRunResult.Skipped("CHIIKAWA", "THURSDAY", "이미 수집 중인 회차가 있음");
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willReturn(result);

        scheduler.collectThursday();

        then(reporter).should().postReport(result);
    }

    @Test
    @DisplayName("월요일 일정이 없는 주제는 수집하지 않는다")
    void skipsTopicWithoutRun() {
        scheduler.collectMonday();

        then(collectService).should(never()).collect("CHIIKAWA", "MONDAY");
        then(reporter).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("수집이 예외로 끝나도 스케줄러 밖으로 던지지 않는다")
    void swallowsCollectFailure() {
        given(collectService.collect("CHIIKAWA", "THURSDAY")).willThrow(new IllegalStateException("db down"));

        scheduler.collectThursday();

        then(reporter).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("[다시 수집]은 버린 회차의 계정으로 다시 수집하고 그 결과를 보고한다")
    void recollectsWithGivenHandles() {
        NewsRunResult.Skipped result = new NewsRunResult.Skipped("CHIIKAWA", "RECOLLECT", "이미 수집 중인 회차가 있음");
        given(collectService.recollect("CHIIKAWA", List.of("chiikawashop_kr"))).willReturn(result);

        scheduler.recollect("CHIIKAWA", List.of("chiikawashop_kr"));

        then(reporter).should().postReport(result);
    }

    @Test
    @DisplayName("다시 수집이 예외로 끝나도 밖으로 던지지 않는다")
    void swallowsRecollectFailure() {
        given(collectService.recollect(any(), any())).willThrow(new IllegalStateException("db down"));

        scheduler.recollect("CHIIKAWA", List.of("chiikawashop_kr"));

        then(reporter).shouldHaveNoInteractions();
    }
}
