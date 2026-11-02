package com.gachi.gacha.server.trade.application;

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
}
