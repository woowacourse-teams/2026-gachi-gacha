package com.gachi.gacha.server.trade.application.event;

import com.gachi.gacha.server.trade.application.TradeIndexService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class TradeIndexEventListener {

    private static final long BACKOFF_MS = 500L;
    private static final int MAX_ATTEMPTS = 3;

    private final TradeIndexService indexService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(TradeChangedEvent e) {
        indexWithRetry(List.of(e.tradeId()));
    }

    private void indexWithRetry(final List<Long> chunk) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (tryIndex(chunk, attempt)) {
                return;
            }
            if (attempt < MAX_ATTEMPTS) {
                sleep(attempt * BACKOFF_MS);
            }
        }
        log.error("ES 동기화 최종 실패 ids={}", chunk);
    }

    private boolean tryIndex(final List<Long> chunk, final int attempt) {
        try {
            indexService.indexAll(chunk);
            return true;
        } catch (Exception ex) {
            log.warn("ES 동기화 실패 attempt={} ids={}", attempt, chunk, ex);
            return false;
        }
    }

    private void sleep(final long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
