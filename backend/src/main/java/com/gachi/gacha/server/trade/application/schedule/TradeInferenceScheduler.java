package com.gachi.gacha.server.trade.application.schedule;

import com.gachi.gacha.server.trade.application.TradeInferenceFacade;
import com.gachi.gacha.server.trade.domain.TradeInferenceJpaRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TradeInferenceScheduler {

    private static final int BATCH_SIZE = 50;
    private static final int MAX_PER_RUN = 200;               // 한 번 실행에서 처리할 최대 건수
    private static final int MAX_CONSECUTIVE_FAILURES = 3;    // ES 장애 시 로그 폭주 방지
    private static final Duration SETTLE = Duration.ofMinutes(1);

    private final TradeInferenceJpaRepository tradeInferenceJpaRepository;
    private final TradeInferenceFacade tradeInferenceFacade;

    @Scheduled(
            fixedDelayString = "${elasticsearch.schedule.inference-fixed-delay}",
            initialDelayString = "${elasticsearch.schedule.inference-initial-delay}")
    public void inferPending() {
        try {
            run();
        } catch (Exception e) {
            log.error("trade 추론 대상 조회 실패", e);
        }
    }

    private void run() {
        LocalDateTime settledBefore = LocalDateTime.now().minus(SETTLE);
        long cursor = Long.MAX_VALUE;
        int succeeded = 0;
        int failed = 0;
        int consecutiveFailures = 0;

        while (succeeded + failed < MAX_PER_RUN && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
            List<Long> ids = tradeInferenceJpaRepository
                    .findTradeIdsNeedingInference(cursor, settledBefore, PageRequest.of(0, BATCH_SIZE));
            if (ids.isEmpty()) {
                break;
            }
            for (Long tradeId : ids) {
                try {
                    tradeInferenceFacade.infer(tradeId);
                    succeeded++;
                    consecutiveFailures = 0;
                } catch (Exception e) {
                    // 한 건의 실패가 나머지를 막지 않는다. 행이 없으니 다음 실행에서 다시 대상이 된다.
                    failed++;
                    consecutiveFailures++;
                    log.error("trade 추론 실패 tradeId={} consecutiveFailures={}", tradeId, consecutiveFailures, e);
                    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                        break;
                    }
                }
            }
            // 실패한 글에 머물지 않도록, 이번 실행에서는 처리한 구간 아래로 계속 내려간다.
            cursor = ids.getLast();
        }

        if (succeeded + failed > 0) {
            log.info("trade 추론 실행 종료 succeeded={} failed={} aborted={}",
                    succeeded, failed, consecutiveFailures == MAX_CONSECUTIVE_FAILURES);
        }
    }
}
