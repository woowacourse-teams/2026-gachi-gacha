package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
import com.gachi.gacha.server.notification.domain.NotificationType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DailyPushLimiterTest {

    private static final Long MEMBER_ID = 1L;
    private static final NotificationType TYPE = NotificationType.TRADE_RECOMMENDATION;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int DAILY_LIMIT = 3;

    @Mock
    private NotificationJpaRepository notificationJpaRepository;

    private DailyPushLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new DailyPushLimiter(notificationJpaRepository);
        ReflectionTestUtils.setField(limiter, "dailyLimit", DAILY_LIMIT);
    }

    /** 카운트에는 방금 저장한 알림이 포함돼 있다. 한도 3이면 1~3번째 알림까지 푸시하고 4번째부터 막는다. */
    @ParameterizedTest(name = "오늘 알림 {0}개(방금 저장분 포함) -> 푸시 가능 = {1}")
    @CsvSource({
            "1, true",
            "2, true",
            "3, true",
            "4, false",
            "10, false"
    })
    @DisplayName("한도 경계에서 푸시 가능 여부를 판단한다")
    void canPush_boundary(final long countIncludingJustSaved, final boolean expected) {
        given(notificationJpaRepository.countByReceiverIdAndTypeAndCreatedAtGreaterThanEqual(
                eq(MEMBER_ID), eq(TYPE), any(LocalDateTime.class))).willReturn(countIncludingJustSaved);

        assertThat(limiter.canPush(MEMBER_ID, TYPE)).isEqualTo(expected);
    }

    @Test
    @DisplayName("집계 시작 시각은 한국 시간 오늘 0시이다 (JVM 타임존과 무관)")
    void canPush_countsFromStartOfTodayInKst() {
        given(notificationJpaRepository.countByReceiverIdAndTypeAndCreatedAtGreaterThanEqual(
                eq(MEMBER_ID), eq(TYPE), any(LocalDateTime.class))).willReturn(0L);

        limiter.canPush(MEMBER_ID, TYPE);

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(notificationJpaRepository).countByReceiverIdAndTypeAndCreatedAtGreaterThanEqual(
                eq(MEMBER_ID), eq(TYPE), captor.capture());

        // JVM 기본 타임존으로 저장된 LocalDateTime 을 다시 시각(Instant)으로 바꿔 KST 오늘 0시와 비교한다.
        var capturedInstant = captor.getValue().atZone(ZoneId.systemDefault()).toInstant();
        var expectedInstant = LocalDate.now(KST).atStartOfDay(KST).toInstant();
        assertThat(capturedInstant).isEqualTo(expectedInstant);
    }
}
