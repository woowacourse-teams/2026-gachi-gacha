package com.gachi.gacha.server.usecase.application;

import com.gachi.gacha.server.comment.domain.CommentJpaRepository;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.trade.application.dto.TradeInfo;
import com.gachi.gacha.server.usecase.application.dto.TradeDetailInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 교환 게시글과 댓글에 걸친 조회를 모은다.
 *
 * <p>TradeService 가 CommentJpaRepository 를 직접 쓰면 trade 가 comment 를 알게 되므로,
 * 두 도메인에 걸친 조합은 여기에 둔다.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TradeCommentService {

    private final TradeService tradeService;
    private final CommentJpaRepository commentJpaRepository;

    public TradeDetailInfo findTradeDetail(final Long tradeId) {
        TradeInfo trade = tradeService.findTrade(tradeId);

        return new TradeDetailInfo(trade, countComments(tradeId));
    }

    public long countComments(final Long tradeId) {
        return commentJpaRepository.countByTradeId(tradeId);
    }
}
