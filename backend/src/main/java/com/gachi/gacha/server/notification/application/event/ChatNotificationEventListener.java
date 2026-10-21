package com.gachi.gacha.server.notification.application.event;

import com.gachi.gacha.server.chat.application.event.ChatMessageSentEvent;
import com.gachi.gacha.server.notification.application.ChatNotificationService;
import com.gachi.gacha.server.notification.infra.NotificationExecutorConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 메시지가 커밋된 뒤에만 푸시를 보낸다. 저장이 롤백된 메시지에는 푸시가 가지 않고,
 * FCM 이 느려도 메시지 송신과 실시간 전달에는 영향이 없다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatNotificationEventListener {

    private final ChatNotificationService chatNotificationService;

    @Async(NotificationExecutorConfig.EXECUTOR_NAME)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(final ChatMessageSentEvent event) {
        try {
            chatNotificationService.notifyReceivers(event);
        } catch (Exception e) {
            log.error("채팅 푸시 처리 실패. roomId = {}, senderId = {}", event.roomId(), event.senderId(), e);
        }
    }
}
