package com.gachi.gacha.server.trade.application;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TradeReindexScheduler {

    private final TradeIndexReconciler reconciler;

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void reconcile() {
        try {
            reconciler.reconcile();
        } catch (Exception e) {
            log.error("trade 정합성 점검 실패", e);
        }
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 60 * 1000)
    public void syncRecent() {
        try {
            reconciler.syncRecent(Duration.ofMinutes(15));
        } catch (Exception e) {
            log.error("trade 증분 동기화 실패", e);
        }
    }
}
