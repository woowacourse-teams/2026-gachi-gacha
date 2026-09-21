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
import jakarta.persistence.EntityManagerFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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

    @Autowired
    private EntityManagerFactory emf;

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

        List<TradeSummaryInfo> result = tradeService.findAllByMemberId(owner.getId(), null);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(TradeSummaryInfo::memberId)
                .containsOnly(owner.getId());
        assertThat(result).extracting(TradeSummaryInfo::title)
                .containsExactlyInAnyOrder("내 거래 1", "내 거래 2");
    }

    @Test
    @DisplayName("거래가 없으면 빈 리스트를 반환한다")
    void findAllByMemberId_empty() {
        assertThat(tradeService.findAllByMemberId(owner.getId(), null)).isEmpty();
    }

    @Test
    @DisplayName("요약 정보의 각 필드가 올바르게 매핑된다")
    void findAllByMemberId_mapping() {
        Category figure = saveCategory("피규어");
        Category anime = saveCategory("애니");
        tradeJpaRepository.save(createTradeWithCategories(owner, "제목", "강남역", List.of(figure, anime)));
        em.flush();
        em.clear();

        TradeSummaryInfo info = tradeService.findAllByMemberId(owner.getId(), null).get(0);

        assertThat(info.title()).isEqualTo("제목");
        assertThat(info.tradePlace()).isEqualTo("강남역");
        assertThat(info.categories()).containsExactlyInAnyOrder("피규어", "애니");
        assertThat(info.status()).isEqualTo(TradeStatus.AVAILABLE);
    }

    @ParameterizedTest
    @EnumSource(TradeStatus.class)
    @DisplayName("상태를 지정하면 해당 상태의 내 거래만 조회한다")
    void findAllByMemberId_filterByStatus(TradeStatus status) {
        for (TradeStatus each : TradeStatus.values()) {
            tradeJpaRepository.save(createTrade(owner, each.name(), each));
            tradeJpaRepository.save(createTrade(other, "남의 " + each.name(), each));
        }
        em.flush();
        em.clear();

        List<TradeSummaryInfo> result = tradeService.findAllByMemberId(owner.getId(), status);

        assertThat(result).extracting(TradeSummaryInfo::title).containsExactly(status.name());
        assertThat(result).extracting(TradeSummaryInfo::status).containsOnly(status);
        assertThat(result).extracting(TradeSummaryInfo::memberId).containsOnly(owner.getId());
    }

    @Test
    @DisplayName("상태가 null이면 모든 상태의 거래를 조회한다")
    void findAllByMemberId_nullStatus_returnsAll() {
        for (TradeStatus status : TradeStatus.values()) {
            tradeJpaRepository.save(createTrade(owner, status.name(), status));
        }
        em.flush();
        em.clear();

        List<TradeSummaryInfo> result = tradeService.findAllByMemberId(owner.getId(), null);

        assertThat(result).extracting(TradeSummaryInfo::status)
                .containsExactlyInAnyOrder(TradeStatus.values());
    }

    @Test
    @DisplayName("해당 상태의 거래가 없으면 빈 리스트를 반환한다")
    void findAllByMemberId_statusWithoutMatch_empty() {
        tradeJpaRepository.save(createTrade(owner, "가능한 거래", TradeStatus.AVAILABLE));
        em.flush();
        em.clear();

        assertThat(tradeService.findAllByMemberId(owner.getId(), TradeStatus.COMPLETED)).isEmpty();
    }

    @Test
    @DisplayName("카테고리가 여러 개이거나 없는 거래도 중복이나 누락 없이 각자의 카테고리로 조회된다")
    void findAllByMemberId_categoriesPerTrade() {
        Category figure = saveCategory("피규어");
        Category anime = saveCategory("애니");
        Category keyring = saveCategory("키링");
        tradeJpaRepository.save(createTradeWithCategories(owner, "A", "강남역", List.of(figure, anime)));
        tradeJpaRepository.save(createTradeWithCategories(owner, "B", "강남역", List.of(anime, keyring)));
        tradeJpaRepository.save(createTrade(owner, "C")); // 카테고리 없음
        em.flush();
        em.clear();

        List<TradeSummaryInfo> result = tradeService.findAllByMemberId(owner.getId(), null);

        assertThat(result).hasSize(3);
        Map<String, List<String>> categoriesByTitle = result.stream()
                .collect(Collectors.toMap(TradeSummaryInfo::title, TradeSummaryInfo::categories));
        assertThat(categoriesByTitle.get("A")).containsExactlyInAnyOrder("피규어", "애니");
        assertThat(categoriesByTitle.get("B")).containsExactlyInAnyOrder("애니", "키링");
        assertThat(categoriesByTitle.get("C")).isEmpty();
    }

    @Test
    @DisplayName("조회 쿼리 수는 거래 건수와 무관하게 일정하다")
    void findAllByMemberId_queryCountIsConstant() {
        Category figure = saveCategory("피규어");
        Category anime = saveCategory("애니");
        tradeJpaRepository.save(createTradeWithCategories(other, "남의 거래", "강남역", List.of(figure, anime)));
        for (int i = 1; i <= 3; i++) {
            tradeJpaRepository.save(createTradeWithCategories(owner, "내 거래 " + i, "강남역", List.of(figure, anime)));
        }
        em.flush();
        em.clear();

        Statistics statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        statistics.clear();
        tradeService.findAllByMemberId(other.getId(), null);   // 1건
        long queriesForOneTrade = statistics.getPrepareStatementCount();

        em.clear();
        statistics.clear();
        tradeService.findAllByMemberId(owner.getId(), null);   // 3건
        long queriesForThreeTrades = statistics.getPrepareStatementCount();

        assertThat(queriesForThreeTrades).isEqualTo(queriesForOneTrade);
    }

    private Category saveCategory(String name) {
        Category category = new Category(null, name);
        em.persist(category);
        return category;
    }

    private Trade createTradeWithCategories(Member member, String title, String tradePlace,
                                            List<Category> categories) {
        Trade trade = createTrade(member, title, tradePlace, TradeStatus.AVAILABLE);
        trade.replaceCategories(categories);
        return trade;
    }

    private Trade createTrade(Member member, String title) {
        return createTrade(member, title, TradeStatus.AVAILABLE);
    }

    private Trade createTrade(Member member, String title, TradeStatus status) {
        return createTrade(member, title, "홍대입구역 8번 출구", status);
    }

    private Trade createTrade(Member member, String title, String tradePlace, TradeStatus status) {
        return Trade.builder()
                .member(member)
                .title(title)
                .description("개봉만 한 상품입니다.")
                .desiredProduction("시나모롤")
                .purchaseStoreAddress("서울특별시 마포구 홍대 가챠샵")
                .tradePlace(tradePlace)
                .availableTime(LocalDateTime.of(2026, 9, 20, 19, 0))
                .status(status)
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
