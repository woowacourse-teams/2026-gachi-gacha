package com.gachi.gacha.server.favorite.signal.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.gachi.gacha.server.category.domain.Category;
import com.gachi.gacha.server.favorite.signal.application.dto.TradeFavoriteCandidate;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignalJpaRepository;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignalJpaRepository.MemberSignalScore;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeInferenceJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import com.gachi.gacha.server.member.domain.Member;
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
class TradeFavoriteMatcherTest {

    private static final Long TRADE_ID = 100L;
    private static final Long AUTHOR_ID = 1L;
    private static final Long RECEIVER_ID = 2L;

    @Mock
    private FavoriteSignalJpaRepository favoriteSignalJpaRepository;

    @Mock
    private TradeJpaRepository tradeJpaRepository;

    @Mock
    private TradeInferenceJpaRepository tradeInferenceJpaRepository;

    private TradeFavoriteMatcher matcher;

    @BeforeEach
    void setUp() {
        matcher = new TradeFavoriteMatcher(
                favoriteSignalJpaRepository, tradeJpaRepository, tradeInferenceJpaRepository);
        ReflectionTestUtils.setField(matcher, "inferenceAcceptScore", 0.0);
        ReflectionTestUtils.setField(matcher, "halfLifeDays", 30.0);
    }

    @Test
    @DisplayName("카테고리와 키워드 신호를 가중 합산하고 게시글 작성자는 제외한다")
    void findCandidates_scoresSignalOverlapAndExcludesAuthor() {
        Member author = Member.builder().id(AUTHOR_ID).build();
        Trade trade = Trade.builder()
                .id(TRADE_ID)
                .member(author)
                .title("치이카와")
                .status(TradeStatus.AVAILABLE)
                .build();
        trade.replaceCategories(List.of(new Category(5621L, "치이카와")));
        given(tradeJpaRepository.getByIdWithCategories(TRADE_ID)).willReturn(trade);
        given(tradeInferenceJpaRepository.findById(TRADE_ID)).willReturn(Optional.empty());

        MemberSignalScore authorCategory = member(AUTHOR_ID);
        MemberSignalScore receiverCategory = score(RECEIVER_ID, "5621", 0.5);
        MemberSignalScore authorKeyword = member(AUTHOR_ID);
        MemberSignalScore receiverKeyword = score(RECEIVER_ID, "치이카와", 0.2);
        given(favoriteSignalJpaRepository.findMemberScores(
                eq("CATEGORY"), anyCollection(), any(), anyDouble()))
                .willReturn(List.of(authorCategory, receiverCategory));
        given(favoriteSignalJpaRepository.findMemberScores(
                eq("KEYWORD"), anyCollection(), any(), anyDouble()))
                .willReturn(List.of(authorKeyword, receiverKeyword));

        List<TradeFavoriteCandidate> candidates = matcher.findCandidates(TRADE_ID);

        assertThat(candidates)
                .containsExactly(new TradeFavoriteCandidate(RECEIVER_ID, 0.38));
    }

    private MemberSignalScore score(final Long memberId, final String value, final double score) {
        MemberSignalScore result = member(memberId);
        given(result.getSignalValue()).willReturn(value);
        given(result.getScore()).willReturn(score);
        return result;
    }

    private MemberSignalScore member(final Long memberId) {
        MemberSignalScore result = mock(MemberSignalScore.class);
        given(result.getMemberId()).willReturn(memberId);
        return result;
    }
}
