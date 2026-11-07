package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
import com.gachi.gacha.server.notification.domain.NotificationType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DailyPushLimiter {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final NotificationJpaRepository notificationJpaRepository;

    @Value("${favorite.push.daily-limit:3}")
    private int dailyLimit;

    @Transactional(readOnly = true)
    public boolean canPush(final Long memberId, final NotificationType type) {
        LocalDateTime startOfToday = LocalDate.now(KST).atStartOfDay(KST)
                .withZoneSameInstant(ZoneId.systemDefault())
                .toLocalDateTime();
        long count = notificationJpaRepository
                .countByReceiverIdAndTypeAndCreatedAtGreaterThanEqual(memberId, type, startOfToday);
        return count <= dailyLimit;   // 방금 저장한 알림이 포함된 개수이므로 <=
    }
}
