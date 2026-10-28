package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.comment.application.event.CommentCreatedEvent;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import com.gachi.gacha.server.notification.application.dto.NotificationInfo;
import com.gachi.gacha.server.notification.application.dto.NotificationPageInfo;
import com.gachi.gacha.server.notification.domain.Notification;
import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationJpaRepository notificationJpaRepository;

    public NotificationPageInfo getNotifications(
            final Long memberId,
            @Nullable final Long lastNotificationId,
            final int pageSize
    ) {
        validatePageRequest(lastNotificationId, pageSize);

        Pageable pageable = PageRequest.of(0, pageSize + 1);
        List<Notification> notifications = findNotifications(memberId, lastNotificationId, pageable);
        return NotificationPageInfo.of(notifications, pageSize);
    }

    @Transactional
    public NotificationInfo createCommentNotification(final Long receiverId, final CommentCreatedEvent event) {
        Notification notification = notificationJpaRepository.save(Notification.ofComment(
                receiverId,
                event.tradeId(),
                event.commentId(),
                event.writerName(),
                event.content()
        ));
        return NotificationInfo.from(notification);
    }

    public long getUnreadCount(final Long memberId) {
        return notificationJpaRepository.countByReceiverIdAndIsReadFalse(memberId);
    }

    @Transactional
    public void read(final Long memberId, final Long notificationId) {
        Notification notification = notificationJpaRepository.getByIdAndReceiverId(notificationId, memberId);
        notification.read();
    }

    @Transactional
    public void readAll(final Long memberId) {
        notificationJpaRepository.readAllByReceiverId(memberId);
    }

    private List<Notification> findNotifications(
            final Long memberId,
            @Nullable final Long lastNotificationId,
            final Pageable pageable
    ) {
        if (lastNotificationId == null) {
            return notificationJpaRepository.findByReceiverIdOrderByIdDesc(memberId, pageable);
        }
        return notificationJpaRepository.findByReceiverIdAndIdLessThanOrderByIdDesc(
                memberId,
                lastNotificationId,
                pageable
        );
    }

    private void validatePageRequest(@Nullable final Long lastNotificationId, final int pageSize) {
        if (pageSize <= 0 || pageSize > MAX_PAGE_SIZE) {
            throw new InvalidPageRequestException(ErrorCode.INVALID_PAGE_REQUEST);
        }
        if (lastNotificationId != null && lastNotificationId <= 0) {
            throw new InvalidPageRequestException(ErrorCode.INVALID_PAGE_REQUEST);
        }
    }
}
