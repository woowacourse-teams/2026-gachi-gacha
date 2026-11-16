package com.gachi.gacha.server.notification.application.event;

import com.gachi.gacha.server.notification.application.TradeRecommendationNotificationService;
import com.gachi.gacha.server.notification.infra.NotificationExecutorConfig;
import com.gachi.gacha.server.trade.application.event.TradeInferenceCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** 추론 결과가 DB에 커밋된 뒤 새 글을 매칭하고 알림으로 전달한다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class TradeRecommendationNotificationEventListener {

    private final TradeRecommendationNotificationService notificationService;

    @Async(NotificationExecutorConfig.EXECUTOR_NAME)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(final TradeInferenceCompletedEvent event) {
        try {
            notificationService.notifyInterestedMembers(event.tradeId());
        } catch (Exception e) {
            log.error("교환글 추천 알림 처리 실패 tradeId={}", event.tradeId(), e);
        }
    }
}
