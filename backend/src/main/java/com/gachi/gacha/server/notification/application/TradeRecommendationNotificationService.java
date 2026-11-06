package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.favorite.signal.application.TradeFavoriteMatcher;
import com.gachi.gacha.server.favorite.signal.application.dto.TradeFavoriteCandidate;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.notification.application.dto.NotificationInfo;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

/** 관심 신호 매칭 결과를 알림함에 저장하고, 새로 저장된 알림만 푸시한다. */
@Slf4j
@Service
@RequiredArgsConstructor
public class TradeRecommendationNotificationService {

    private final TradeFavoriteMatcher tradeFavoriteMatcher;
    private final TradeJpaRepository tradeJpaRepository;
    private final MemberBlockService memberBlockService;
    private final NotificationService notificationService;
    private final PushService pushService;

    @Value("${notification.trade-recommendation.max-age-days:7}")
    private int maxAgeDays;

    @Value("${notification.trade-recommendation.dry-run:false}")
    private boolean dryRun;

    @Value("${notification.trade-recommendation.minimum-score:0.02}")
    private double minimumScore;

    public void notifyInterestedMembers(final Long tradeId) {
        Trade trade = tradeJpaRepository.findById(tradeId).orElse(null);
        if (trade == null) {
            log.info("교환글 추천 알림 생략: 글이 없음. tradeId={}", tradeId);
            return;
        }
        if (!isEligible(trade)) {
            log.debug("교환글 추천 알림 생략: 새 글이 아니거나 거래 불가 상태. tradeId={}", tradeId);
            return;
        }

        List<TradeFavoriteCandidate> candidates = tradeFavoriteMatcher.findCandidates(tradeId);
        alarm(tradeId, candidates, trade);
    }

    private void alarm(Long tradeId, List<TradeFavoriteCandidate> candidates, Trade trade) {
        int notified = 0;
        int skipped = 0;
        for (TradeFavoriteCandidate candidate : candidates) {
            if (candidate.interestScore() < minimumScore) {
                skipped++;
                continue;
            }
            Long receiverId = candidate.memberId();
            if (memberBlockService.isBlockedBetween(receiverId, trade.getMember().getId())) {
                skipped++;
                continue;
            }
            if (dryRun) {
                log.info("교환글 추천 알림 드라이런 tradeId={} receiverId={} score={}",
                        tradeId, receiverId, candidate.interestScore());
                continue;
            }
            if (sendIfNew(receiverId, trade, candidate)) {
                notified++;
            } else {
                skipped++;
            }
        }
        log.info("교환글 추천 알림 처리 완료 tradeId={} candidates={} notified={} skipped={} dryRun={}",
                tradeId, candidates.size(), notified, skipped, dryRun);
    }

    private boolean isEligible(final Trade trade) {
        return (trade.getStatus() == TradeStatus.AVAILABLE)
                && trade.getCreatedAt() != null
                && !trade.getCreatedAt().isBefore(LocalDateTime.now().minusDays(maxAgeDays));
    }

    private boolean sendIfNew(
            final Long receiverId,
            final Trade trade,
            final TradeFavoriteCandidate candidate
    ) {
        try {
            Optional<NotificationInfo> created = notificationService.createTradeRecommendationNotification(
                    receiverId, trade.getId(), trade.getTitle());
            if (created.isEmpty()) {
                return false;
            }
            pushService.sendTo(receiverId, PushMessage.from(created.get()));
            log.debug("교환글 추천 알림 발송 완료 tradeId={} receiverId={} score={}",
                    trade.getId(), receiverId, candidate.interestScore());
            return true;
        } catch (DataIntegrityViolationException e) {
            // 동시 처리된 이벤트의 중복 알림은 부분 유니크 인덱스가 차단한다.
            if (notificationService.hasTradeRecommendationNotification(receiverId, trade.getId())) {
                log.debug("교환글 중복 추천 알림 생략 tradeId={} receiverId={}", trade.getId(), receiverId);
                return false;
            }
            throw e;
        }
    }
}
