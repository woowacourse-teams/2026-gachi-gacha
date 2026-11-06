package com.gachi.gacha.server.trade.application.schedule;

import com.gachi.gacha.server.trade.infra.TradeIndexReconciler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TradeReindexScheduler {

    private final TradeIndexReconciler reconciler;

    @Scheduled(cron = "${elasticsearch.schedule.reconcile-cron}", zone = "${elasticsearch.schedule.reconcile-zone}")
    public void reconcile() {
        try {
            reconciler.reconcile();
        } catch (Exception e) {
            log.error("trade 정합성 점검 실패", e);
        }
    }

    @Scheduled(fixedDelayString = "${elasticsearch.schedule.sync-fixed-delay}", initialDelayString = "${elasticsearch.schedule.sync-initial-delay}")
    public void syncRecent() {
        try {
            reconciler.syncRecent();
        } catch (Exception e) {
            log.error("trade 증분 동기화 실패", e);
        }
    }
}
