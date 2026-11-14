package com.gachi.gacha.server.favorite.trade.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.favorite.trade.application.dto.TradeFavoriteInfo;
import com.gachi.gacha.server.favorite.trade.application.event.TradeFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.trade.domain.TradeFavorite;
import com.gachi.gacha.server.favorite.trade.domain.TradeFavoriteJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.InvalidTradeException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TradeFavoriteService {

    private static final int MAX_PAGE_SIZE = 50;

    private final TradeFavoriteJpaRepository tradeFavoriteJpaRepository;
    private final TradeJpaRepository tradeJpaRepository;
    private final MemberJpaRepository memberJpaRepository;
    private final ApplicationEventPublisher publisher;
    /**
     * 관심 등록. 이미 있으면 아무것도 하지 않는다(멱등).
     * 동시 요청으로 유니크 제약에 걸리면 DataIntegrityViolationException 이 밖으로 나가므로
     * 호출하는 쪽(Facade)이 트랜잭션 바깥에서 처리한다.
     */
    @Transactional
    public void add(final Long memberId, final Long tradeId) {
        if (tradeFavoriteJpaRepository.existsByMemberIdAndTradeId(memberId, tradeId)) {
            return;
        }
        Trade trade = tradeJpaRepository.findById(tradeId)
                .orElseThrow(() -> new InvalidTradeException(ErrorCode.TRADE_NOT_FOUND));
        Member member = memberJpaRepository.getReferenceById(memberId);

        tradeFavoriteJpaRepository.save(TradeFavorite.of(member, trade));
        publisher.publishEvent(new TradeFavoriteChangedEvent(memberId, tradeId, true));
    }

    @Transactional
    public void remove(final Long memberId, final Long tradeId) {
        tradeFavoriteJpaRepository.deleteByMemberIdAndTradeId(memberId, tradeId);
        publisher.publishEvent(new TradeFavoriteChangedEvent(memberId, tradeId, false));
    }

    public boolean isFavorite(final Long memberId, final Long tradeId) {
        return tradeFavoriteJpaRepository.existsByMemberIdAndTradeId(memberId, tradeId);
    }

    public TradeFavoriteInfo.Page findMyFavorites(final Long memberId, final Long cursor, final int size) {
        long start = cursor != null ? cursor : Long.MAX_VALUE;
        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);

        Slice<TradeFavorite> slice = tradeFavoriteJpaRepository
                .findSliceByMemberId(memberId, start, PageRequest.of(0, pageSize));

        List<TradeFavoriteInfo> items = slice.getContent().stream()
                .map(TradeFavoriteInfo::from)
                .toList();
        Long nextCursor = slice.hasNext() ? items.getLast().favoriteId() : null;
        return new TradeFavoriteInfo.Page(items, nextCursor, slice.hasNext());
    }

    /** 글 목록/상세 응답의 favorited 표시용. 비로그인(memberId == null)이면 빈 집합. */
    public Set<Long> findFavoriteTradeIds(final Long memberId, final List<Long> tradeIds) {
        if (memberId == null || tradeIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(tradeFavoriteJpaRepository.findFavoriteTradeIds(memberId, tradeIds));
    }
}
