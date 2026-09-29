package com.gachi.gacha.server.usecase.domain;

import com.gachi.gacha.server.gacha.domain.CollectionSource;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.store.domain.Store;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class StoreGachaRepositoryTest {

    private static final double SEOUL_CITY_HALL_LAT = 37.5663;
    private static final double SEOUL_CITY_HALL_LNG = 126.9779;
    private static final double FAR_AWAY_LAT = 37.4979;
    private static final double FAR_AWAY_LNG = 127.0276;

    @Autowired
    private StoreGachaJpaRepository storeGachaJpaRepository;

    @Autowired
    private GachaJpaRepository gachaJpaRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("가챠 ID 목록을 받아 각 가챠별 매장 개수를 올바르게 집계한다")
    void countByGachaIds() {
        // given: 테스트용 가챠 2개 생성
        Gacha gacha1 = gachaJpaRepository.save(Gacha.builder().name("가챠 1").source(CollectionSource.MANUAL).build());
        Gacha gacha2 = gachaJpaRepository.save(Gacha.builder().name("가챠 2").source(CollectionSource.MANUAL).build());
        Gacha gacha3 = gachaJpaRepository.save(Gacha.builder().name("가챠 3").source(CollectionSource.MANUAL).build()); // 매장 매핑 안 할 가챠

        // given: 테스트용 매장 2개 생성 (Store 엔티티 생성자에 맞춰 작성해주세요)
        Store store1 = createStore("가까운 매장", SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG);
        Store store2 = createStore("먼 매장", FAR_AWAY_LAT, FAR_AWAY_LNG);

        entityManager.persist(store1);
        entityManager.persist(store2);

        // given: StoreGacha 매핑 (가챠 1은 매장 2곳에 입점, 가챠 2는 매장 1곳에 입점)
        storeGachaJpaRepository.save(StoreGacha.builder().gacha(gacha1).store(store1).build());
        storeGachaJpaRepository.save(StoreGacha.builder().gacha(gacha1).store(store2).build());
        storeGachaJpaRepository.save(StoreGacha.builder().gacha(gacha2).store(store1).build());

        entityManager.flush();
        entityManager.clear();

        // when: 가챠 1과 가챠 2의 ID로 매장 수 집계 쿼리 실행
        List<Long> targetGachaIds = List.of(gacha1.getId(), gacha2.getId(), gacha3.getId());
        List<StoreGachaCount> result = storeGachaJpaRepository.countByGachaIds(targetGachaIds);

        // then: 결과 검증
        assertThat(result).hasSize(2); // 매장이 매핑된 가챠는 2개이므로 결과도 2개여야 함 (가챠 3은 매장이 없어 조회되지 않음)

        // 결과 맵핑 및 값 검증 (순서는 상관없이 포함 여부 확인)
        assertThat(result).extracting("gachaId")
                .containsExactlyInAnyOrder(gacha1.getId(), gacha2.getId());

        // 각 가챠별 count 값 검증
        StoreGachaCount count1 = result.stream().filter(r -> r.gachaId().equals(gacha1.getId())).findFirst().orElseThrow();
        StoreGachaCount count2 = result.stream().filter(r -> r.gachaId().equals(gacha2.getId())).findFirst().orElseThrow();

        assertThat(count1.storeCount()).isEqualTo(2L); // 가챠 1은 매장 2개
        assertThat(count2.storeCount()).isEqualTo(1L); // 가챠 2는 매장 1개
    }

    private Store createStore(String name, double latitude, double longitude) {
        return Store.builder()
                .name(name)
                .thumbnailUrl("https://example.com/thumb.png")
                .latitude(latitude)
                .longitude(longitude)
                .address("서울특별시 중구 세종대로 110")
                .build();
    }
}
