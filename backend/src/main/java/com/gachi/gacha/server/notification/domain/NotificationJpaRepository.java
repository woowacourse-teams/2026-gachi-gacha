package com.gachi.gacha.server.notification.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.notification.domain.exception.NotificationNotFoundException;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationJpaRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByReceiverIdOrderByIdDesc(Long receiverId, Pageable pageable);

    List<Notification> findByReceiverIdAndIdLessThanOrderByIdDesc(
            Long receiverId,
            Long lastNotificationId,
            Pageable pageable
    );

    long countByReceiverIdAndIsReadFalse(Long receiverId);

    Optional<Notification> findByIdAndReceiverId(Long id, Long receiverId);

    /**
     * 남의 알림과 없는 알림을 구분하지 않는다. 다른 회원의 알림 ID가 존재하는지 드러내지 않기 위해서다.
     */
    default Notification getByIdAndReceiverId(final Long id, final Long receiverId) {
        return findByIdAndReceiverId(id, receiverId)
                .orElseThrow(() -> new NotificationNotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND));
    }

    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE Notification notification
            SET notification.isRead = true
            WHERE notification.receiverId = :receiverId
              AND notification.isRead = false
            """)
    void readAllByReceiverId(Long receiverId);
}
