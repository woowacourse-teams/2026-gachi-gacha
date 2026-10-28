package com.gachi.gacha.server.usecase.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.comment.application.CommentService;
import com.gachi.gacha.server.comment.application.dto.CommentInfo;
import com.gachi.gacha.server.comment.domain.Comment;
import com.gachi.gacha.server.comment.domain.CommentJpaRepository;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.trade.application.dto.TradeSearchCondition;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.TradeNotFoundException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인한 차단자에게 차단한 회원의 게시글·회원 댓글이 숨겨지는지 실제 쿼리로 검증한다.
 */
@Transactional
@SpringBootTest
class BlockedContentVisibilityTest {

    private static final String MASKED_IP = "118.44";

    @Autowired
    private TradeService tradeService;

    @Autowired
    private TradeCommentService tradeCommentService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private MemberBlockService memberBlockService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private CommentJpaRepository commentJpaRepository;

    private final String titleToken = "block-visibility-" + UUID.randomUUID();

    private Member blocker;
    private Member blocked;
    private Member other;

    @BeforeEach
    void setUp() {
        blocker = memberJpaRepository.save(Member.builder().nickname("blocker").build());
        blocked = memberJpaRepository.save(Member.builder().nickname("blocked").build());
        other = memberJpaRepository.save(Member.builder().nickname("other").build());
    }

    @Nested
    @DisplayName("게시글 목록 조회")
    class FindTrades {

        @Test
        @DisplayName("로그인한 차단자에게는 차단한 회원의 게시글을 제외하고 전체 개수도 맞춘다")
        void excludesTradesOfBlockedAuthor() {
            // given
            saveTrade(blocked);
            Trade visibleTrade = saveTrade(other);
            memberBlockService.block(blocker.getId(), blocked.getId());

            // when
            Page<TradeSummaryInfo> page = findTrades(blocker.getId());

            // then
            assertThat(page.getContent()).extracting(TradeSummaryInfo::tradeId)
                    .containsExactly(visibleTrade.getId());
            assertThat(page.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("차단당한 회원과 비로그인 사용자에게는 게시글을 숨기지 않는다")
        void keepsTradesForBlockedMemberAndAnonymous() {
            // given
            saveTrade(blocker);
            saveTrade(blocked);
            memberBlockService.block(blocker.getId(), blocked.getId());

            // when & then
            assertThat(findTrades(blocked.getId()).getTotalElements()).isEqualTo(2);
            assertThat(findTrades(null).getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("게시글 상세 조회")
    class FindTradeDetail {

        @Test
        @DisplayName("로그인한 차단자가 차단한 회원의 게시글을 조회하면 없는 게시글과 같은 예외가 발생한다")
        void rejectsTradeOfBlockedAuthor() {
            // given
            Trade trade = saveTrade(blocked);
            memberBlockService.block(blocker.getId(), blocked.getId());

            // when & then
            assertThatThrownBy(() -> tradeCommentService.findTradeDetail(blocker.getId(), trade.getId()))
                    .isInstanceOf(TradeNotFoundException.class);
            assertThat(tradeCommentService.findTradeDetail(null, trade.getId()).trade().tradeId())
                    .isEqualTo(trade.getId());
        }
    }

    @Nested
    @DisplayName("댓글 조회")
    class FindComments {

        @Test
        @DisplayName("로그인한 차단자에게는 차단한 회원의 댓글만 제외하고 비회원 댓글은 남긴다")
        void excludesCommentsOfBlockedMember() {
            // given
            Trade trade = saveTrade(other);
            commentJpaRepository.save(Comment.ofMember(trade.getId(), blocked.getId(), "blocked", null, "차단된 댓글"));
            commentJpaRepository.save(Comment.ofAnonymous(trade.getId(), "비회원", MASKED_IP, "비회원 댓글"));
            commentJpaRepository.save(Comment.ofMember(trade.getId(), other.getId(), "other", null, "다른 회원 댓글"));
            memberBlockService.block(blocker.getId(), blocked.getId());

            // when
            List<CommentInfo> comments = commentService.findComments(blocker.getId(), trade.getId());

            // then
            assertThat(comments).extracting(CommentInfo::content)
                    .containsExactly("비회원 댓글", "다른 회원 댓글");
            assertThat(tradeCommentService.findTradeDetail(blocker.getId(), trade.getId()).commentCount())
                    .isEqualTo(2);
        }

        @Test
        @DisplayName("비로그인 사용자에게는 모든 댓글을 반환한다")
        void keepsAllCommentsForAnonymous() {
            // given
            Trade trade = saveTrade(other);
            commentJpaRepository.save(Comment.ofMember(trade.getId(), blocked.getId(), "blocked", null, "회원 댓글"));
            commentJpaRepository.save(Comment.ofAnonymous(trade.getId(), "비회원", MASKED_IP, "비회원 댓글"));
            memberBlockService.block(blocker.getId(), blocked.getId());

            // when & then
            assertThat(commentService.findComments(null, trade.getId())).hasSize(2);
            assertThat(tradeCommentService.countComments(null, trade.getId())).isEqualTo(2);
        }
    }

    private Page<TradeSummaryInfo> findTrades(final Long viewerId) {
        TradeSearchCondition condition = TradeSearchCondition.builder()
                .keyword(titleToken)
                .viewerId(viewerId)
                .build();
        return tradeService.findTrades(condition, PageRequest.of(0, 20));
    }

    private Trade saveTrade(final Member author) {
        return tradeJpaRepository.save(Trade.builder().member(author).title(titleToken).build());
    }
}
