package com.gachi.gacha.server.gacha.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.category.domain.Category;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.application.dto.GachaWithStoreCountInfo;
import com.gachi.gacha.server.gacha.domain.CollectionSource;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaCategory;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.usecase.domain.StoreGacha;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class GachaServiceTest {

    @Autowired
    private GachaService gachaService;

    @Autowired
    private GachaJpaRepository gachaJpaRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("가챠와 다중 카테고리 테스트 데이터 저장 및 조회 검증")
    void insertAndFindGachaWithCategories() {
        Category category1 = new Category("음식");
        Category category2 = new Category("카페");
        entityManager.persist(category1);
        entityManager.persist(category2);

        Gacha gacha = Gacha.builder()
                .name("테스트 가챠 피규어")
                .caption("인기 피규어 뽑기")
                .thumbnailUrl("https://example.com/image.png")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-001")
                .build();

        GachaCategory gc1 = new GachaCategory(null, gacha, category1);
        GachaCategory gc2 = new GachaCategory(null, gacha, category2);

        gacha.getGachaCategories().add(gc1);
        gacha.getGachaCategories().add(gc2);

        Gacha savedGacha = gachaJpaRepository.save(gacha);

        entityManager.flush();
        entityManager.clear();

        Gacha foundGacha = gachaJpaRepository.findByIdWithCategories(savedGacha.getId()).orElseThrow();

        assertThat(foundGacha.getName()).isEqualTo("테스트 가챠 피규어");
        assertThat(foundGacha.getGachaCategories()).hasSize(2);
        assertThat(foundGacha.getGachaCategories())
                .extracting(gachaCategory -> gachaCategory.getCategory().getName())
                .containsExactlyInAnyOrder("음식", "카페");
    }

    @Test
    @DisplayName("카테고리 ID 목록으로 가챠 페이징 조회 검증")
    void findGachasByCategoryIdsWithPaging() {
        Category category1 = new Category("음식");
        Category category2 = new Category("카페");
        Category category3 = new Category("노을");
        entityManager.persist(category1);
        entityManager.persist(category2);
        entityManager.persist(category3);

        Gacha gacha1 = Gacha.builder()
                .name("가챠 1")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-001")
                .build();
        gacha1.getGachaCategories().add(new GachaCategory(null, gacha1, category1));
        gacha1.getGachaCategories().add(new GachaCategory(null, gacha1, category2));

        Gacha gacha2 = Gacha.builder()
                .name("가챠 2")
                .source(CollectionSource.MANUAL)
                .productCode("PROD-002")
                .build();
        gacha2.getGachaCategories().add(new GachaCategory(null, gacha2, category2));

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

        List<Long> targetCategoryIds = List.of(category1.getId(), category2.getId());
        Pageable pageable = PageRequest.of(0, 10);

        Page<Gacha> gachas = gachaJpaRepository.findByCategoryIds(targetCategoryIds, pageable);
        Page<GachaInfo> result = gachas.map(GachaInfo::from);

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent())
                .extracting(GachaInfo::name)
                .containsExactlyInAnyOrder("가챠 1", "가챠 2");
    }

    @Test
    @DisplayName("storeCount 내림차순, 동점이면 id 오름차순으로 정렬하고 매장 0개 가챠도 포함한다")
    void findAllGachaByIds_sortedByStoreCountDesc() {
        Category category1 = new Category("음식");
        Category category2 = new Category("카페");
        Category category3 = new Category("노을");
        entityManager.persist(category1);
        entityManager.persist(category2);
        entityManager.persist(category3);

        Store s1 = saveStore("매장1");
        Store s2 = saveStore("매장2");
        Store s3 = saveStore("매장3");

        Gacha store3 = saveGacha("매장3", "PROD-001", category1, category2);
        saveGacha("매장0", "PROD-002", category1);
        Gacha store1 = saveGacha("매장1", "PROD-003", category2);
        Gacha store3Tie = saveGacha("매장3동점", "PROD-004", category1);
        Gacha other = saveGacha("다른카테고리", "PROD-005", category3);

        insertStoreGacha(store3, s1, s2, s3);
        insertStoreGacha(store1, s1);
        insertStoreGacha(store3Tie, s1, s2, s3);
        insertStoreGacha(other, s1, s2);
        entityManager.flush();
        entityManager.clear();

        Page<GachaWithStoreCountInfo> result = gachaService.findAllGachaByIds(
                List.of(category1.getId(), category2.getId()), PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(4);
        assertThat(result.getContent())
                .extracting(GachaWithStoreCountInfo::name)
                .containsExactly("매장3", "매장3동점", "매장1", "매장0");
        assertThat(result.getContent())
                .extracting(GachaWithStoreCountInfo::storeCount)
                .containsExactly(3, 3, 1, 0);
    }

    @Test
    @DisplayName("여러 카테고리에 속한 가챠의 storeCount가 중복 집계되지 않고 categories가 모두 내려간다")
    void findAllGachaByIds_noDuplicatedCount() {
        Category category1 = new Category("음식");
        Category category2 = new Category("카페");
        entityManager.persist(category1);
        entityManager.persist(category2);

        Store s1 = saveStore("매장1");
        Store s2 = saveStore("매장2");
        Store s3 = saveStore("매장3");

        Gacha gacha = saveGacha("멀티카테고리", "PROD-001", category1, category2);
        insertStoreGacha(gacha, s1, s2, s3);
        entityManager.flush();
        entityManager.clear();

        Page<GachaWithStoreCountInfo> result = gachaService.findAllGachaByIds(
                List.of(category1.getId(), category2.getId()), PageRequest.of(0, 10));

        GachaWithStoreCountInfo info = result.getContent().get(0);
        assertThat(info.storeCount()).isEqualTo(3); // 6이면 JOIN 중복 문제
        assertThat(info.categories()).containsExactlyInAnyOrder("음식", "카페");
    }

    @Test
    @DisplayName("페이지를 넘겨도 정렬 순서가 유지된다")
    void findAllGachaByIds_paging() {
        Category category = new Category("음식");
        entityManager.persist(category);

        Store s1 = saveStore("매장1");
        Store s2 = saveStore("매장2");
        Store s3 = saveStore("매장3");

        Gacha a = saveGacha("A(3)", "PROD-001", category);
        Gacha b = saveGacha("B(2)", "PROD-002", category);
        Gacha c = saveGacha("C(1)", "PROD-003", category);
        saveGacha("D(0)", "PROD-004", category);

        insertStoreGacha(a, s1, s2, s3);
        insertStoreGacha(b, s1, s2);
        insertStoreGacha(c, s1);
        entityManager.flush();
        entityManager.clear();

        Page<GachaWithStoreCountInfo> page0 =
                gachaService.findAllGachaByIds(List.of(category.getId()), PageRequest.of(0, 2));
        Page<GachaWithStoreCountInfo> page1 =
                gachaService.findAllGachaByIds(List.of(category.getId()), PageRequest.of(1, 2));

        assertThat(page0.getContent()).extracting(GachaWithStoreCountInfo::name)
                .containsExactly("A(3)", "B(2)");
        assertThat(page1.getContent()).extracting(GachaWithStoreCountInfo::name)
                .containsExactly("C(1)", "D(0)");
        assertThat(page0.getTotalElements()).isEqualTo(4);
    }

    @Test
    @DisplayName("Pageable에 sort가 들어와도 무시하고 storeCount 기준으로 정렬한다")
    void findAllGachaByIds_ignoresPageableSort() {
        Category category = new Category("음식");
        entityManager.persist(category);

        Store s1 = saveStore("매장1");
        Store s2 = saveStore("매장2");

        Gacha few = saveGacha("적음", "PROD-001", category);
        Gacha many = saveGacha("많음", "PROD-002", category);

        insertStoreGacha(few, s1);
        insertStoreGacha(many, s1, s2);
        entityManager.flush();
        entityManager.clear();

        // 컨트롤러에서 createdAt 정렬이 넘어온 상황
        Pageable withSort = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GachaWithStoreCountInfo> result =
                gachaService.findAllGachaByIds(List.of(category.getId()), withSort);

        assertThat(result.getContent()).extracting(GachaWithStoreCountInfo::name)
                .containsExactly("많음", "적음");
    }

    @Test
    @DisplayName("일치하는 가챠가 없으면 빈 페이지를 반환한다")
    void findAllGachaByIds_empty() {
        Page<GachaWithStoreCountInfo> result =
                gachaService.findAllGachaByIds(List.of(999L), PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
    }

    private Store saveStore(String name) {
        Store store = Store.builder()
                .name(name)
                .address("서울시 테스트구 테스트로 1")
                .latitude(37.5665)
                .longitude(126.9780)
                .build();
        entityManager.persist(store);
        return store;
    }

    private Gacha saveGacha(String name, String productCode, Category... categories) {
        Gacha gacha = Gacha.builder()
                .name(name)
                .source(CollectionSource.MANUAL)
                .productCode(productCode)
                .build();
        for (Category category : categories) {
            gacha.getGachaCategories().add(new GachaCategory(null, gacha, category));
        }
        return gachaJpaRepository.save(gacha);
    }

    private void insertStoreGacha(Gacha gacha, Store... stores) {
        for (Store store : stores) {
            entityManager.persist(new StoreGacha(null, store, gacha));
        }
    }
}
