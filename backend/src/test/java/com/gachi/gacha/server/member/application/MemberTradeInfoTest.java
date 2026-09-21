package com.gachi.gacha.server.member.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.gacha.domain.Category;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class MemberTradeInfoTest {

    @Autowired
    private TradeService tradeService;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private EntityManager em;

    private Member owner;
    private Member other;

    @BeforeEach
    void setUp() {
        owner = memberJpaRepository.save(createMember("owner"));
        other = memberJpaRepository.save(createMember("other"));
    }

    @Test
    @DisplayName("해당 회원의 거래만 조회한다")
    void findAllByMemberId() {
        tradeJpaRepository.save(createTrade(owner, "내 거래 1"));
        tradeJpaRepository.save(createTrade(owner, "내 거래 2"));
        tradeJpaRepository.save(createTrade(other, "남의 거래"));
        em.flush();
        em.clear();

        List<TradeSummaryInfo> result = tradeService.findAllByMemberId(owner.getId());

        assertThat(result).hasSize(2);
        assertThat(result).extracting(TradeSummaryInfo::memberId)
                .containsOnly(owner.getId());
        assertThat(result).extracting(TradeSummaryInfo::title)
                .containsExactlyInAnyOrder("내 거래 1", "내 거래 2");
    }

    @Test
    @DisplayName("거래가 없으면 빈 리스트를 반환한다")
    void findAllByMemberId_empty() {
        assertThat(tradeService.findAllByMemberId(owner.getId())).isEmpty();
    }

    @Test
    @DisplayName("요약 정보의 각 필드가 올바르게 매핑된다")
    void findAllByMemberId_mapping() {
        Category figure = saveCategory("피규어");
        Category anime = saveCategory("애니");
        tradeJpaRepository.save(createTradeWithCategories(owner, "제목", "강남역", List.of(figure, anime)));
        em.flush();
        em.clear();

        TradeSummaryInfo info = tradeService.findAllByMemberId(owner.getId()).get(0);

        assertThat(info.title()).isEqualTo("제목");
        assertThat(info.tradePlace()).isEqualTo("강남역");
        assertThat(info.categories()).containsExactlyInAnyOrder("피규어", "애니");
        assertThat(info.status()).isEqualTo(TradeStatus.AVAILABLE);
    }

    private Category saveCategory(String name) {
        Category category = new Category(null, name);
        em.persist(category);
        return category;
    }

    private Trade createTradeWithCategories(Member member, String title, String tradePlace,
                                            List<Category> categories) {
        Trade trade = createTrade(member, title, tradePlace);
        trade.replaceCategories(categories);
        return trade;
    }

    private Trade createTrade(Member member, String title) {
        return createTrade(member, title, "홍대입구역 8번 출구");
    }

    private Trade createTrade(Member member, String title, String tradePlace) {
        return Trade.builder()
                .member(member)
                .title(title)
                .description("개봉만 한 상품입니다.")
                .desiredProduction("시나모롤")
                .purchaseStoreAddress("서울특별시 마포구 홍대 가챠샵")
                .tradePlace(tradePlace)
                .availableTime(LocalDateTime.of(2026, 9, 20, 19, 0))
                .status(TradeStatus.AVAILABLE)
                .build();
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .profileImageUrl("https://example.com/profile/" + nickname + ".png")
                .desireTradeLocation("강남역")
                .build();
    }
}
