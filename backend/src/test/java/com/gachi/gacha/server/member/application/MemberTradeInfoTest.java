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
import com.gachi.gacha.server.trade.domain.Place;
import com.gachi.gacha.server.trade.domain.TradeImage;
import com.gachi.gacha.server.trade.domain.TradeImageJpaRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class MemberTradeInfoTest {

    /** 컨트롤러의 @PageableDefault(size = 20, sort = "id", DESC)와 같은 조건이다. */
    private static final Pageable DEFAULT_PAGE = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "id"));

    @Autowired
    private TradeService tradeService;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private TradeImageJpaRepository tradeImageJpaRepository;

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

        Page<TradeSummaryInfo> result = findAll(owner, null);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).extracting(TradeSummaryInfo::memberId)
                .containsOnly(owner.getId());
        assertThat(result.getContent()).extracting(TradeSummaryInfo::title)
                .containsExactlyInAnyOrder("내 거래 1", "내 거래 2");
    }

    @Test
    @DisplayName("거래가 없으면 빈 페이지를 반환한다")
    void findAllByMemberId_empty() {
        Page<TradeSummaryInfo> result = findAll(owner, null);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("요약 정보의 각 필드가 올바르게 매핑된다")
    void findAllByMemberId_mapping() {
        Category figure = saveCategory("피규어");
        Category anime = saveCategory("애니");
        tradeJpaRepository.save(createTradeWithCategories(owner, "제목", "강남역", List.of(figure, anime)));
        em.flush();
        em.clear();

        TradeSummaryInfo info = findAll(owner, null).getContent().get(0);

        assertThat(info.title()).isEqualTo("제목");
        assertThat(info.tradePlace().name()).isEqualTo("강남역");
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

        Page<TradeSummaryInfo> result = findAll(owner, status);

        assertThat(result.getContent()).extracting(TradeSummaryInfo::title).containsExactly(status.name());
        assertThat(result.getContent()).extracting(TradeSummaryInfo::status).containsOnly(status);
        assertThat(result.getContent()).extracting(TradeSummaryInfo::memberId).containsOnly(owner.getId());
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("상태가 null이면 모든 상태의 거래를 조회한다")
    void findAllByMemberId_nullStatus_returnsAll() {
        for (TradeStatus status : TradeStatus.values()) {
            tradeJpaRepository.save(createTrade(owner, status.name(), status));
        }
        em.flush();
        em.clear();

        Page<TradeSummaryInfo> result = findAll(owner, null);

        assertThat(result.getContent()).extracting(TradeSummaryInfo::status)
                .containsExactlyInAnyOrder(TradeStatus.values());
    }

    @Test
    @DisplayName("해당 상태의 거래가 없으면 빈 페이지를 반환한다")
    void findAllByMemberId_statusWithoutMatch_empty() {
        tradeJpaRepository.save(createTrade(owner, "가능한 거래", TradeStatus.AVAILABLE));
        em.flush();
        em.clear();

        Page<TradeSummaryInfo> result = findAll(owner, TradeStatus.COMPLETED);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
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

        Page<TradeSummaryInfo> result = findAll(owner, null);

        assertThat(result.getContent()).hasSize(3);
        Map<String, List<String>> categoriesByTitle = result.getContent().stream()
                .collect(Collectors.toMap(TradeSummaryInfo::title, TradeSummaryInfo::categories));
        assertThat(categoriesByTitle.get("A")).containsExactlyInAnyOrder("피규어", "애니");
        assertThat(categoriesByTitle.get("B")).containsExactlyInAnyOrder("애니", "키링");
        assertThat(categoriesByTitle.get("C")).isEmpty();
    }

    @Test
    @DisplayName("각 거래의 첫 번째 이미지가 썸네일이 되고, 이미지가 없으면 썸네일도 없다")
    void findAllByMemberId_thumbnailPerTrade() {
        Trade withImages = tradeJpaRepository.save(createTrade(owner, "이미지 있음"));
        Trade withoutImages = tradeJpaRepository.save(createTrade(owner, "이미지 없음"));
        saveImage(withImages, "https://example.com/first.png");
        saveImage(withImages, "https://example.com/second.png");
        em.flush();
        em.clear();

        Map<String, String> thumbnailByTitle = findAll(owner, null).getContent().stream()
                .collect(Collectors.toMap(
                        TradeSummaryInfo::title,
                        info -> String.valueOf(info.thumbnailUrl())));

        assertThat(thumbnailByTitle.get(withImages.getTitle())).isEqualTo("https://example.com/first.png");
        assertThat(thumbnailByTitle.get(withoutImages.getTitle())).isEqualTo("null");
    }

    @Test
    @DisplayName("id 내림차순 정렬대로 최신 거래가 먼저 조회된다")
    void findAllByMemberId_sortedByIdDesc() {
        tradeJpaRepository.save(createTrade(owner, "A"));
        tradeJpaRepository.save(createTrade(owner, "B"));
        tradeJpaRepository.save(createTrade(owner, "C"));
        em.flush();
        em.clear();

        Page<TradeSummaryInfo> result = findAll(owner, null);

        // 2단계 조회(IN 절)는 순서가 보장되지 않으므로, 1단계의 정렬 순서가 유지되는지 확인한다.
        assertThat(result.getContent()).extracting(TradeSummaryInfo::title)
                .containsExactly("C", "B", "A");
    }

    @Test
    @DisplayName("페이지 크기만큼 나눠서 조회하고, 전체 개수와 페이지 정보가 올바르다")
    void findAllByMemberId_paging() {
        for (int i = 1; i <= 5; i++) {
            tradeJpaRepository.save(createTrade(owner, "거래 " + i));
        }
        tradeJpaRepository.save(createTrade(other, "남의 거래"));
        em.flush();
        em.clear();

        Page<TradeSummaryInfo> firstPage = tradeService.findAllByMemberId(owner.getId(), null, pageOf(0, 2));
        Page<TradeSummaryInfo> lastPage = tradeService.findAllByMemberId(owner.getId(), null, pageOf(2, 2));

        assertThat(firstPage.getContent()).extracting(TradeSummaryInfo::title)
                .containsExactly("거래 5", "거래 4");
        assertThat(firstPage.getTotalElements()).isEqualTo(5);
        assertThat(firstPage.getTotalPages()).isEqualTo(3);
        assertThat(firstPage.hasNext()).isTrue();

        assertThat(lastPage.getContent()).extracting(TradeSummaryInfo::title)
                .containsExactly("거래 1");
        assertThat(lastPage.getTotalElements()).isEqualTo(5);
        assertThat(lastPage.hasNext()).isFalse();
    }

    @Test
    @DisplayName("상태 필터를 걸면 전체 개수도 해당 상태의 개수만 센다")
    void findAllByMemberId_pagingWithStatus() {
        for (int i = 1; i <= 3; i++) {
            tradeJpaRepository.save(createTrade(owner, "가능 " + i, TradeStatus.AVAILABLE));
        }
        tradeJpaRepository.save(createTrade(owner, "완료 1", TradeStatus.COMPLETED));
        tradeJpaRepository.save(createTrade(owner, "완료 2", TradeStatus.COMPLETED));
        em.flush();
        em.clear();

        Page<TradeSummaryInfo> result =
                tradeService.findAllByMemberId(owner.getId(), TradeStatus.COMPLETED, pageOf(0, 1));

        assertThat(result.getContent()).extracting(TradeSummaryInfo::title).containsExactly("완료 2");
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.hasNext()).isTrue();
    }

    @Test
    @DisplayName("범위를 벗어난 페이지를 요청하면 빈 내용과 실제 전체 개수를 반환한다")
    void findAllByMemberId_pageOutOfRange() {
        tradeJpaRepository.save(createTrade(owner, "A"));
        tradeJpaRepository.save(createTrade(owner, "B"));
        tradeJpaRepository.save(createTrade(owner, "C"));
        em.flush();
        em.clear();

        Page<TradeSummaryInfo> result = tradeService.findAllByMemberId(owner.getId(), null, pageOf(99, 20));

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(3);
        assertThat(result.hasNext()).isFalse();
    }

    @Test
    @DisplayName("조회 결과가 비어 있으면 카테고리·이미지 추가 조회 없이 페이지 조회 쿼리 1번으로 끝난다")
    void findAllByMemberId_emptyResult_noExtraQueries() {
        tradeJpaRepository.save(createTrade(other, "남의 거래"));
        em.flush();
        em.clear();

        Statistics statistics = enabledStatistics();
        statistics.clear();
        findAll(owner, null);

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
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

        Statistics statistics = enabledStatistics();

        statistics.clear();
        findAll(other, null);   // 1건
        long queriesForOneTrade = statistics.getPrepareStatementCount();

        em.clear();
        statistics.clear();
        findAll(owner, null);   // 3건
        long queriesForThreeTrades = statistics.getPrepareStatementCount();

        assertThat(queriesForThreeTrades).isEqualTo(queriesForOneTrade);
    }

    private Page<TradeSummaryInfo> findAll(Member member, TradeStatus status) {
        return tradeService.findAllByMemberId(member.getId(), status, DEFAULT_PAGE);
    }

    private Pageable pageOf(int page, int size) {
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    }

    private Statistics enabledStatistics() {
        Statistics statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        return statistics;
    }

    private Category saveCategory(String name) {
        Category category = new Category(null, name);
        em.persist(category);
        return category;
    }

    private void saveImage(Trade trade, String imageUrl) {
        tradeImageJpaRepository.save(TradeImage.builder()
                .trade(trade)
                .imageUrl(imageUrl)
                .build());
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
                .purchaseStore(new Place("가챠샵 홍대점", "서울특별시 마포구 양화로 100", 37.5563, 126.9236))
                .tradePlace(new Place(tradePlace, "서울특별시 강남구 강남대로 396", 37.4979, 127.0276))
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
