package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.comment.application.event.CommentCreatedEvent;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.notification.application.dto.NotificationInfo;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 댓글이 달리면 게시글 작성자에게 알림을 남기고 푸시를 보낸다.
 *
 * <p>알림 저장은 자체 트랜잭션에서 끝내고, FCM 발송은 트랜잭션 밖에서 한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentNotificationService {

    private final TradeJpaRepository tradeJpaRepository;
    private final MemberBlockService memberBlockService;
    private final NotificationService notificationService;
    private final PushService pushService;

    public void notifyTradeOwner(final CommentCreatedEvent event) {
        Optional<Long> tradeOwnerId = findTradeOwnerId(event.tradeId());
        if (tradeOwnerId.isEmpty()) {
            log.warn("댓글 알림 생략: 게시글을 찾을 수 없음. tradeId = {}, commentId = {}",
                    event.tradeId(), event.commentId());
            return;
        }
        if (shouldNotify(tradeOwnerId.get(), event)) {
            notify(tradeOwnerId.get(), event);
        }
    }

    private Optional<Long> findTradeOwnerId(final Long tradeId) {
        return tradeJpaRepository.findById(tradeId)
                .map(trade -> trade.getMember().getId());
    }

    /**
     * 본인 댓글과 게시글 작성자가 차단한 회원의 댓글은 알리지 않는다. 비회원 댓글은 차단 대상이 아니라 항상 알린다.
     */
    private boolean shouldNotify(final Long tradeOwnerId, final CommentCreatedEvent event) {
        Long writerId = event.writerId();
        if (writerId == null) {
            return true;
        }
        if (tradeOwnerId.equals(writerId)) {
            return false;
        }
        if (memberBlockService.hasBlocked(tradeOwnerId, writerId)) {
            log.info("댓글 알림 생략: 차단한 회원의 댓글. tradeOwnerId = {}, writerId = {}, tradeId = {}, commentId = {}",
                    tradeOwnerId, writerId, event.tradeId(), event.commentId());
            return false;
        }
        return true;
    }

    private void notify(final Long tradeOwnerId, final CommentCreatedEvent event) {
        NotificationInfo notification = notificationService.createCommentNotification(tradeOwnerId, event);
        pushService.sendTo(tradeOwnerId, PushMessage.from(notification));
    }
}
