package com.gachi.gacha.server.store.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.exception.GachaNotFoundException;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;
import com.gachi.gacha.server.store.domain.StoreDetailJpaRepository;
import com.gachi.gacha.server.store.domain.StoreImage;
import com.gachi.gacha.server.store.domain.StoreImageJpaRepository;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.domain.exception.InvalidNearbyRequestException;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
import com.gachi.gacha.server.usecase.domain.StoreGacha;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class StoreServiceTest {

    // 서울시청 근처 좌표. radius(3000m) 안팎을 나누는 기준점으로 사용한다.
    private static final double SEOUL_CITY_HALL_LAT = 37.5663;
    private static final double SEOUL_CITY_HALL_LNG = 126.9779;
    // 위 좌표에서 약 3km 이상 떨어진 지점(강남역)
    private static final double FAR_AWAY_LAT = 37.4979;
    private static final double FAR_AWAY_LNG = 127.0276;

    @Autowired
    private StoreService storeService;

    @Autowired
    private StoreJpaRepository storeJpaRepository;

    @Autowired
    private StoreDetailJpaRepository storeDetailJpaRepository;

    @Autowired
    private StoreImageJpaRepository storeImageJpaRepository;

    @Autowired
    private EntityManager em;

    private Store nearStore;
    private Store farStore;

    @BeforeEach
    void setUp() {
        nearStore = storeJpaRepository.save(createStore("가까운 매장", SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG));
        farStore = storeJpaRepository.save(createStore("먼 매장", FAR_AWAY_LAT, FAR_AWAY_LNG));

        storeDetailJpaRepository.save(createStoreDetail(nearStore, 5));
        storeDetailJpaRepository.save(createStoreDetail(farStore, 3));

        em.flush();
        em.clear();
    }

    @Nested
    @DisplayName("findNearbyStores")
    class FindNearbyStores {

        @Test
        @DisplayName("반경 안의 매장만 거리순으로 반환한다")
        void returnsOnlyStoresWithinRadius() {
            StoreNearbyResult result = storeService.findNearbyStores(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 3000, null);

            assertThat(result.stores()).extracting(StoreNearbyResult.StoreInfo::storeId)
                    .containsExactly(nearStore.getId());
            assertThat(result.center().latitude()).isEqualTo(SEOUL_CITY_HALL_LAT);
            assertThat(result.center().longitude()).isEqualTo(SEOUL_CITY_HALL_LNG);
            assertThat(result.radius()).isEqualTo(3000);
        }

        @Test
        @DisplayName("floor 조건과 일치하는 매장이 없으면 빈 결과를 반환한다")
        void returnsEmptyWhenFloorDoesNotMatch() {
            StoreNearbyResult result = storeService.findNearbyStores(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 3000, 99);

            assertThat(result.stores()).isEmpty();
        }

        @Test
        @DisplayName("위도가 범위를 벗어나면 예외가 발생한다")
        void rejectsInvalidLatitude() {
            assertThatThrownBy(() -> storeService.findNearbyStores(91.0, SEOUL_CITY_HALL_LNG, 3000, null))
                    .isInstanceOf(InvalidNearbyRequestException.class);
        }

        @Test
        @DisplayName("경도가 범위를 벗어나면 예외가 발생한다")
        void rejectsInvalidLongitude() {
            assertThatThrownBy(() -> storeService.findNearbyStores(SEOUL_CITY_HALL_LAT, 181.0, 3000, null))
                    .isInstanceOf(InvalidNearbyRequestException.class);
        }

        @Test
        @DisplayName("radius가 허용 범위를 벗어나면 예외가 발생한다")
        void rejectsInvalidRadius() {
            assertThatThrownBy(() -> storeService.findNearbyStores(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 50, null))
                    .isInstanceOf(InvalidNearbyRequestException.class);
            assertThatThrownBy(() -> storeService.findNearbyStores(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 30_000, null))
                    .isInstanceOf(InvalidNearbyRequestException.class);
        }

        @Test
        @DisplayName("floor가 0이면 예외가 발생한다")
        void rejectsZeroFloor() {
            assertThatThrownBy(() -> storeService.findNearbyStores(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 3000, 0))
                    .isInstanceOf(InvalidNearbyRequestException.class);
        }
    }

    @Nested
    @DisplayName("findNearbyStoresByGachaId")
    class FindNearbyStoresByGachaId {

        private Gacha gacha;

        @BeforeEach
        void setUpGacha() {
            gacha = Gacha.builder()
                    .name("쿠로미 피규어")
                    .build();
            em.persist(gacha);
            em.flush();
        }

        @Test
        @DisplayName("존재하지 않는 가챠면 GachaNotFoundException을 던지고 매장 조회는 하지 않는다")
        void throwsWhenGachaNotFound() {
            long nonExistentGachaId = gacha.getId() + 1_000_000L;

            assertThatThrownBy(() -> storeService.findNearbyStoresByGachaId(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 3000, null, nonExistentGachaId))
                    .isInstanceOf(GachaNotFoundException.class);
        }

        @Test
        @DisplayName("가챠 검증에 앞서 좌표 검증이 먼저 실패하면 InvalidNearbyRequestException이 발생한다")
        void rejectsInvalidRequestBeforeGachaCheck() {
            // 존재하지 않는 gachaId(0L)를 같이 넘겨도, 좌표 검증이 먼저 걸려야 한다.
            assertThatThrownBy(() -> storeService.findNearbyStoresByGachaId(
                    91.0, SEOUL_CITY_HALL_LNG, 3000, null, 0L))
                    .isInstanceOf(InvalidNearbyRequestException.class);
        }

        @Test
        @DisplayName("가챠는 존재하지만 취급 매장이 없으면 빈 결과를 반환한다")
        void returnsEmptyWhenNoStoreSellsTheGacha() {
            StoreNearbyResult result = storeService.findNearbyStoresByGachaId(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 3000, null, gacha.getId());

            assertThat(result.stores()).isEmpty();
        }

        @Test
        @DisplayName("반경 안에서 해당 가챠를 취급하는 매장만 반환한다")
        void returnsOnlyStoresSellingTheGachaWithinRadius() {
            linkStoreToGacha(nearStore, gacha);
            linkStoreToGacha(farStore, gacha);
            em.flush();
            em.clear();

            StoreNearbyResult result = storeService.findNearbyStoresByGachaId(
                    SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG, 3000, null, gacha.getId());

            // farStore도 이 가챠를 취급하지만 반경 밖이므로 제외되어야 한다.
            assertThat(result.stores()).extracting(StoreNearbyResult.StoreInfo::storeId)
                    .containsExactly(nearStore.getId());
        }

        @Test
        @DisplayName("같은 (gacha_id, store_id) 조합을 두 번 저장하면 유니크 제약 위반으로 실패한다")
        void rejectsDuplicateStoreGachaLink() {
            // V10 마이그레이션의 uk_store_gacha_gacha_store 제약이 실제로 걸려 있는지 확인한다.
            // 이 제약 덕분에 애플리케이션(EXISTS 쿼리) 쪽에서는 중복 방어 로직이 필요 없다.
            linkStoreToGacha(nearStore, gacha);
            em.flush();

            assertThatThrownBy(() -> {
                linkStoreToGacha(nearStore, gacha);
                em.flush();
            }).isInstanceOf(PersistenceException.class);
        }

        private void linkStoreToGacha(Store store, Gacha gacha) {
            em.persist(StoreGacha.builder().store(store).gacha(gacha).build());
        }
    }

    @Nested
    @DisplayName("findStores")
    class FindStores {

        @Test
        @DisplayName("페이지 단위로 매장과 상세정보를 조합해 반환한다")
        void returnsStoresWithDetails() {
            Pageable pageable = PageRequest.of(0, 10);

            var page = storeService.findStores(pageable);

            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent()).extracting(StoreListResult::storeId)
                    .containsExactlyInAnyOrder(nearStore.getId(), farStore.getId());
        }

        @Test
        @DisplayName("페이지 번호가 음수면 예외가 발생한다")
        void rejectsNegativePage() {
            // PageRequest.of(...)는 음수 page를 아예 생성하지 못하게 막고 있어서,
            // validatePageRequest의 pageNumber < 0 분기를 실제로 태우려면 mock으로 우회해야 한다.
            Pageable invalidPageable = mock(Pageable.class);
            given(invalidPageable.getPageNumber()).willReturn(-1);
            given(invalidPageable.getPageSize()).willReturn(10);

            assertThatThrownBy(() -> storeService.findStores(invalidPageable))
                    .isInstanceOf(InvalidPageRequestException.class);
        }

        @Test
        @DisplayName("페이지 크기가 0 이하면 예외가 발생한다")
        void rejectsNonPositivePageSize() {
            Pageable invalidPageable = mock(Pageable.class);
            given(invalidPageable.getPageNumber()).willReturn(0);
            given(invalidPageable.getPageSize()).willReturn(0);

            assertThatThrownBy(() -> storeService.findStores(invalidPageable))
                    .isInstanceOf(InvalidPageRequestException.class);
        }

        @Test
        @DisplayName("StoreDetail이 없는 매장이 섞여 있으면 StoreNotFoundException이 발생한다")
        void throwsWhenStoreDetailMissing() {
            Store orphanStore = storeJpaRepository.save(createStore("상세정보 없는 매장", SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG));
            em.flush();
            em.clear();

            assertThatThrownBy(() -> storeService.findStores(PageRequest.of(0, 10)))
                    .isInstanceOf(StoreNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getStore")
    class GetStore {

        @Test
        @DisplayName("매장 상세 정보와 이미지 목록을 함께 반환한다")
        void returnsStoreDetailWithImages() {
            storeImageJpaRepository.save(createStoreImage(nearStore, "https://example.com/1.png"));
            storeImageJpaRepository.save(createStoreImage(nearStore, "https://example.com/2.png"));
            em.flush();
            em.clear();

            StoreDetailResult result = storeService.getStore(nearStore.getId());

            assertThat(result.storeId()).isEqualTo(nearStore.getId());
            assertThat(result.images()).extracting(StoreDetailResult.StoreImageInfo::imageUrl)
                    .containsExactlyInAnyOrder("https://example.com/1.png", "https://example.com/2.png");
        }

        @Test
        @DisplayName("존재하지 않는 매장이면 StoreNotFoundException이 발생한다")
        void throwsWhenStoreNotFound() {
            assertThatThrownBy(() -> storeService.getStore(999L))
                    .isInstanceOf(StoreNotFoundException.class);
        }
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

    private StoreDetail createStoreDetail(Store store, int machineAmount) {
        // StoreDetail은 @MapsId로 Store의 PK를 그대로 공유한다. id를 직접 지정하지 않고
        // store 연관관계만 넘기면 영속화 시점에 store의 식별자가 그대로 복사된다.
        return StoreDetail.builder()
                .store(store)
                .machineAmount(machineAmount)
                .facilities(List.of())
                .build();
    }

    private StoreImage createStoreImage(Store store, String imageUrl) {
        return StoreImage.builder()
                .store(store)
                .imageUrl(imageUrl)
                .build();
    }
}
