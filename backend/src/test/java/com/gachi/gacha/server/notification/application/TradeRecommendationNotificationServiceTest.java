package com.gachi.gacha.server.notification.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
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
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TradeRecommendationNotificationServiceTest {

    private static final Long TRADE_ID = 100L;
    private static final Long AUTHOR_ID = 1L;
    private static final Long RECEIVER_ID = 2L;

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

    private TradeRecommendationNotificationService service;
    private Trade trade;

    @BeforeEach
    void setUp() {
        service = new TradeRecommendationNotificationService(
                tradeFavoriteMatcher, tradeJpaRepository, memberBlockService, notificationService, pushService);
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
        givenCandidate(0.15);

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService, never()).createTradeRecommendationNotification(any(), any(), any());
        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("새로 저장한 추천 알림만 푸시로 전달한다")
    void notifyInterestedMembers_persistsThenPushes() {
        givenCandidate(0.15);
        given(memberBlockService.isBlockedBetween(RECEIVER_ID, AUTHOR_ID)).willReturn(false);
        NotificationInfo notification = NotificationInfo.builder()
                .notificationId(300L)
                .type(NotificationType.TRADE_RECOMMENDATION)
                .title("관심 있을 만한 새 교환글")
                .body("치이카와 신상품 교환")
                .tradeId(TRADE_ID)
                .build();
        given(notificationService.createTradeRecommendationNotification(
                RECEIVER_ID, TRADE_ID, trade.getTitle())).willReturn(Optional.of(notification));

        service.notifyInterestedMembers(TRADE_ID);

        verify(notificationService).createTradeRecommendationNotification(RECEIVER_ID, TRADE_ID, trade.getTitle());
        verify(pushService).sendTo(eq(RECEIVER_ID), any(PushMessage.class));
    }

    @Test
    @DisplayName("이미 등록된 추천 알림은 다시 푸시하지 않는다")
    void notifyInterestedMembers_duplicateNotification() {
        givenCandidate(0.15);
        given(memberBlockService.isBlockedBetween(RECEIVER_ID, AUTHOR_ID)).willReturn(false);
        given(notificationService.createTradeRecommendationNotification(
                RECEIVER_ID, TRADE_ID, trade.getTitle())).willReturn(Optional.empty());

        service.notifyInterestedMembers(TRADE_ID);

        verify(pushService, never()).sendTo(any(), any());
    }

    @Test
    @DisplayName("최소 관심 점수보다 낮으면 후보를 건너뛴다")
    void notifyInterestedMembers_belowMinimumScore() {
        givenCandidate(0.01);

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

    private void givenCandidate(final double score) {
        given(tradeFavoriteMatcher.findCandidates(TRADE_ID))
                .willReturn(List.of(new TradeFavoriteCandidate(RECEIVER_ID, score)));
    }
}
