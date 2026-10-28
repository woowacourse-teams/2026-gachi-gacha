package com.gachi.gacha.server.notification.application.event;

import com.gachi.gacha.server.comment.application.event.CommentCreatedEvent;
import com.gachi.gacha.server.notification.application.CommentNotificationService;
import com.gachi.gacha.server.notification.infra.NotificationExecutorConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 댓글이 커밋된 뒤에만 알림을 처리한다. 롤백된 댓글에는 알림이 가지 않고,
 * 알림 처리가 실패하거나 느려도 댓글 작성 응답에는 영향이 없다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CommentNotificationEventListener {

    private final CommentNotificationService commentNotificationService;

    @Async(NotificationExecutorConfig.EXECUTOR_NAME)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(final CommentCreatedEvent event) {
        try {
            commentNotificationService.notifyTradeOwner(event);
        } catch (Exception e) {
            log.error("댓글 알림 처리 실패. tradeId = {}, commentId = {}", event.tradeId(), event.commentId(), e);
        }
    }
}
