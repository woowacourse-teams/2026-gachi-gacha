package com.gachi.gacha.server.gacha.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.gacha.domain.Category;
import com.gachi.gacha.server.gacha.domain.CollectionSource;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaCategory;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
}
