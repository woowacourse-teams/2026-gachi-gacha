package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.favorite.signal.application.TradeFavoriteMatcher;
import com.gachi.gacha.server.favorite.signal.application.dto.TradeFavoriteCandidate;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.notification.application.dto.NotificationInfo;
import com.gachi.gacha.server.notification.domain.NotificationType;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TradeRecommendationNotificationServiceTest {

    private static final Long TRADE_ID = 100L;
    private static final Long AUTHOR_ID = 1L;
    private static final Long RECEIVER_ID = 2L;
    private static final Long OTHER_RECEIVER_ID = 3L;
    private static final NotificationType TYPE = NotificationType.TRADE_RECOMMENDATION;

    @Mock
    private TradeFavoriteMatcher tradeFavoriteMatcher;

    @Mock
    private TradeJpaRepository tradeJpaRepository;

    @Mock
    private MemberBlockService memberBlockService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PushService pushService;

    @Mock
    private DailyPushLimiter pushLimiter;

    private TradeRecommendationNotificationService service;
    private Trade trade;

    @BeforeEach
    void setUp() {
        service = new TradeRecommendationNotificationService(
                tradeFavoriteMatcher, tradeJpaRepository, memberBlockService, notificationService, pushService, pushLimiter);
        ReflectionTestUtils.setField(service, "maxAgeDays", 7);
        ReflectionTestUtils.setField(service, "minimumScore", 0.02);
        ReflectionTestUtils.setField(service, "dryRun", false);

        trade = Trade.builder()
                .id(TRADE_ID)
                .member(Member.builder().id(AUTHOR_ID).build())
                .title("치이카와 신상품 교환")
                .status(TradeStatus.AVAILABLE)
                .build();
        ReflectionTestUtils.setField(trade, "createdAt", LocalDateTime.now().minusMinutes(2));
        given(tradeJpaRepository.findById(TRADE_ID)).willReturn(Optional.of(trade));
    }

    @Test
    @DisplayName("드라이런에서는 로그만 남기고 알림을 저장하거나 푸시하지 않는다")
    void notifyInterestedMembers_dryRun() {
        ReflectionTestUtils.setField(service, "dryRun", true);
        givenCandidates(RECEIVER_ID, 0.15);

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService, never()).createTradeRecommendationNotification(any(), any(), any());
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("새로 저장한 추천 알림은 한도 안이면 푸시로 전달한다")
    void notifyInterestedMembers_persistsThenPushes() {
        givenCandidates(RECEIVER_ID, 0.15);
        givenNotificationCreated(RECEIVER_ID, 300L);
        given(pushLimiter.canPush(RECEIVER_ID, TYPE)).willReturn(true);

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService).createTradeRecommendationNotification(RECEIVER_ID, TRADE_ID, trade.getTitle());
        verify(pushService).sendTo(eq(RECEIVER_ID), any(PushMessage.class));
    }

    @Test
    @DisplayName("일일 푸시 한도를 넘으면 알림함에는 저장하되 푸시는 보내지 않는다")
    void notifyInterestedMembers_overDailyLimit() {
        givenCandidates(RECEIVER_ID, 0.15);
        givenNotificationCreated(RECEIVER_ID, 300L);
        given(pushLimiter.canPush(RECEIVER_ID, TYPE)).willReturn(false);

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService).createTradeRecommendationNotification(RECEIVER_ID, TRADE_ID, trade.getTitle());
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("한도 확인은 알림을 저장한 수신자별로 각각 한다")
    void notifyInterestedMembers_limitCheckedPerReceiver() {
        givenCandidates(RECEIVER_ID, 0.15, OTHER_RECEIVER_ID, 0.10);
        givenNotificationCreated(RECEIVER_ID, 300L);
        givenNotificationCreated(OTHER_RECEIVER_ID, 301L);
        given(pushLimiter.canPush(RECEIVER_ID, TYPE)).willReturn(false);
        given(pushLimiter.canPush(OTHER_RECEIVER_ID, TYPE)).willReturn(true);

        service.notifyInterestedMembers(TRADE_ID);

        verify(pushService, never()).sendTo(eq(RECEIVER_ID), any());
        verify(pushService).sendTo(eq(OTHER_RECEIVER_ID), any(PushMessage.class));
    }

    @Test
    @DisplayName("푸시 발송이 실패해도 알림 처리는 계속되고 다음 후보도 처리한다")
    void notifyInterestedMembers_pushFailureDoesNotStopOthers() {
        givenCandidates(RECEIVER_ID, 0.15, OTHER_RECEIVER_ID, 0.10);
        givenNotificationCreated(RECEIVER_ID, 300L);
        givenNotificationCreated(OTHER_RECEIVER_ID, 301L);
        given(pushLimiter.canPush(any(), eq(TYPE))).willReturn(true);
        doThrow(new RuntimeException("push failure"))
                .when(pushService).sendTo(eq(RECEIVER_ID), any(PushMessage.class));

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService).createTradeRecommendationNotification(OTHER_RECEIVER_ID, TRADE_ID, trade.getTitle());
        verify(pushService).sendTo(eq(OTHER_RECEIVER_ID), any(PushMessage.class));
    }

    @Test
    @DisplayName("이미 등록된 추천 알림은 한도 확인도 푸시도 하지 않는다")
    void notifyInterestedMembers_duplicateNotification() {
        givenCandidates(RECEIVER_ID, 0.15);
        given(notificationService.createTradeRecommendationNotification(
                RECEIVER_ID, TRADE_ID, trade.getTitle())).willReturn(Optional.empty());

        service.notifyInterestedMembers(TRADE_ID);

        verify(pushLimiter, never()).canPush(any(), any());
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("동시 처리로 중복 저장이 막히면 푸시하지 않고 넘어간다")
    void notifyInterestedMembers_concurrentDuplicate() {
        givenCandidates(RECEIVER_ID, 0.15);
        given(notificationService.createTradeRecommendationNotification(
                RECEIVER_ID, TRADE_ID, trade.getTitle())).willThrow(new DataIntegrityViolationException("duplicate"));
        given(notificationService.hasTradeRecommendationNotification(RECEIVER_ID, TRADE_ID)).willReturn(true);

        service.notifyInterestedMembers(TRADE_ID);

        verify(pushLimiter, never()).canPush(any(), any());
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("중복이 아닌 무결성 예외는 그대로 던진다")
    void notifyInterestedMembers_otherIntegrityViolation() {
        givenCandidates(RECEIVER_ID, 0.15);
        given(notificationService.createTradeRecommendationNotification(
                RECEIVER_ID, TRADE_ID, trade.getTitle())).willThrow(new DataIntegrityViolationException("other"));
        given(notificationService.hasTradeRecommendationNotification(RECEIVER_ID, TRADE_ID)).willReturn(false);

        assertThatThrownBy(() -> service.notifyInterestedMembers(TRADE_ID))
                .isInstanceOf(DataIntegrityViolationException.class);
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("차단 관계인 후보는 알림을 저장하지 않는다")
    void notifyInterestedMembers_blocked() {
        givenCandidates(RECEIVER_ID, 0.15);
        given(memberBlockService.isBlockedBetween(RECEIVER_ID, AUTHOR_ID)).willReturn(true);

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService, never()).createTradeRecommendationNotification(any(), any(), any());
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("최소 관심 점수보다 낮으면 후보를 건너뛴다")
    void notifyInterestedMembers_belowMinimumScore() {
        givenCandidates(RECEIVER_ID, 0.01);

        service.notifyInterestedMembers(TRADE_ID);

        verify(memberBlockService, never()).isBlockedBetween(any(), any());
        verify(notificationService, never()).createTradeRecommendationNotification(any(), any(), any());
    }

    @Test
    @DisplayName("오래된 교환글은 매칭하지 않는다")
    void notifyInterestedMembers_oldTrade() {
        ReflectionTestUtils.setField(trade, "createdAt", LocalDateTime.now().minusDays(8));

        service.notifyInterestedMembers(TRADE_ID);

        verify(tradeFavoriteMatcher, never()).findCandidates(TRADE_ID);
        verify(notificationService, never()).createTradeRecommendationNotification(any(), any(), any());
    }

    private void givenCandidates(final Object... memberIdAndScorePairs) {
        List<TradeFavoriteCandidate> candidates = new java.util.ArrayList<>();
        for (int i = 0; i < memberIdAndScorePairs.length; i += 2) {
            candidates.add(new TradeFavoriteCandidate(
                    (Long) memberIdAndScorePairs[i], (Double) memberIdAndScorePairs[i + 1]));
        }
        given(tradeFavoriteMatcher.findCandidates(TRADE_ID)).willReturn(candidates);
    }

    private void givenNotificationCreated(final Long receiverId, final Long notificationId) {
        NotificationInfo notification = NotificationInfo.builder()
                .notificationId(notificationId)
                .type(TYPE)
                .title("관심 있을 만한 새 교환글")
                .body("치이카와 신상품 교환")
                .tradeId(TRADE_ID)
                .build();
        given(notificationService.createTradeRecommendationNotification(
                receiverId, TRADE_ID, trade.getTitle())).willReturn(Optional.of(notification));
    }
}
