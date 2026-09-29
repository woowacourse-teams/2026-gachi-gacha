package com.gachi.gacha.server.gacha.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.category.domain.Category;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.domain.CollectionSource;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaCategory;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class GachaServiceTest {

    @Autowired
    private GachaJpaRepository gachaJpaRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("가챠와 다중 카테고리 테스트 데이터 저장 및 조회 검증")
    void insertAndFindGachaWithCategories() {
        // given: 테스트용 카테고리 엔티티 생성 및 영속화
        Category category1 = new Category("음식");
        Category category2 = new Category("카페");
        entityManager.persist(category1);
        entityManager.persist(category2);

        // given: 가챠 엔티티 생성
        Gacha gacha = Gacha.builder()
                .name("테스트 가챠 피규어")
                .caption("인기 피규어 뽑기")
                .thumbnailUrl("https://example.com/image.png")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-001")
                .build();

        // given: 연관관계 편의 메서드(또는 수동 생성)를 통해 카테고리 매핑
        // GachaCategory 생성자에 맞춰 데이터를 넣고 Gacha의 리스트에 추가합니다.
        GachaCategory gc1 = new GachaCategory(null, gacha, category1);
        GachaCategory gc2 = new GachaCategory(null, gacha, category2);

        gacha.getGachaCategories().add(gc1);
        gacha.getGachaCategories().add(gc2);

        // when: 가챠 저장 (CascadeType.ALL 설정에 의해 중간 테이블 데이터도 함께 저장됨)
        Gacha savedGacha = gachaJpaRepository.save(gacha);

        // 영속성 컨텍스트 초기화 후 페치 조인 메서드로 재조회 테스트
        entityManager.flush();
        entityManager.clear();

        Gacha foundGacha = gachaJpaRepository.findByIdWithCategories(savedGacha.getId()).orElseThrow();

        // then: 검증
        assertThat(foundGacha.getName()).isEqualTo("테스트 가챠 피규어");
        assertThat(foundGacha.getGachaCategories()).hasSize(2);
        assertThat(foundGacha.getGachaCategories())
                .extracting(gachaCategory -> gachaCategory.getCategory().getName())
                .containsExactlyInAnyOrder("음식", "카페");
    }

    @Test
    @DisplayName("카테고리 ID 목록으로 가챠 페이징 조회 검증")
    void findGachasByCategoryIdsWithPaging() {
        // given: 테스트용 카테고리 생성 및 영속화
        Category category1 = new Category("음식");
        Category category2 = new Category("카페");
        Category category3 = new Category("노을");
        entityManager.persist(category1);
        entityManager.persist(category2);
        entityManager.persist(category3);

        // given: 가챠 1 생성 (음식, 카페 카테고리 소속)
        Gacha gacha1 = Gacha.builder()
                .name("가챠 1")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-001")
                .build();
        gacha1.getGachaCategories().add(new GachaCategory(null, gacha1, category1));
        gacha1.getGachaCategories().add(new GachaCategory(null, gacha1, category2));

        // given: 가챠 2 생성 (카페 카테고리 소속)
        Gacha gacha2 = Gacha.builder()
                .name("가챠 2")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-002")
                .build();
        gacha2.getGachaCategories().add(new GachaCategory(null, gacha2, category2));

        // given: 가챠 3 생성 (노을 카테고리 소속 - 매칭 안 됨)
        Gacha gacha3 = Gacha.builder()
                .name("가챠 3")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-003")
                .build();
        gacha3.getGachaCategories().add(new GachaCategory(null, gacha3, category3));

        gachaJpaRepository.save(gacha1);
        gachaJpaRepository.save(gacha2);
        gachaJpaRepository.save(gacha3);

        entityManager.flush();
        entityManager.clear();

        // when: '음식(category1)' 또는 '카페(category2)' ID를 포함하는 가챠를 페이징 조회
        List<Long> targetCategoryIds = List.of(category1.getId(), category2.getId());
        Pageable pageable = PageRequest.of(0, 10);

        // 서비스 메서드 호출 (또는 레포지토리 직접 호출: gachaJpaRepository.findByCategoryIds(targetCategoryIds, pageable))
        Page<Gacha> gachas = gachaJpaRepository.findByCategoryIds(targetCategoryIds, pageable);
        Page<GachaInfo> result = gachas.map(GachaInfo::from);

        // then: 가챠 1과 가챠 2가 조회되어야 함 (가챠 3은 제외)
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent())
                .extracting(GachaInfo::name)
                .containsExactlyInAnyOrder("가챠 1", "가챠 2");
    }
}
