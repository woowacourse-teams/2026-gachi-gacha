package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StoreService {

    private static final int MIN_SEARCH_RADIUS = 100;
    private static final int MAX_SEARCH_RADIUS = 20_000;

    private final StoreJpaRepository storeJpaRepository;
    private final StoreDetailJpaRepository storeDetailJpaRepository;
    private final StoreImageJpaRepository storeImageJpaRepository;

    public StoreNearbyResult findNearbyStores(
            final Double latitude,
            final Double longitude,
            final Integer radius,
            final Integer floor
    ) {
        validateNearbyRequest(latitude, longitude, radius, floor);

        List<StoreJpaRepository.StoreWithDistance> nearbyStores = storeJpaRepository.findNearbyStores(latitude,
                longitude, radius, floor);

        List<StoreNearbyResult.StoreInfo> storeInfos = nearbyStores.stream()
                .map(result -> StoreNearbyResult.StoreInfo.builder()
                        .name(result.getName())
                        .storeId(result.getStoreId())
                        .thumbnailUrl(result.getThumbnailUrl())
                        .address(result.getAddress())
                        .floor(result.getFloor())
                        .unit(result.getUnit())
                        .latitude(result.getLatitude())
                        .longitude(result.getLongitude())
                        .distance(result.getDistance())
                        .build())
                .toList();

        return StoreNearbyResult.of(latitude, longitude, radius, storeInfos);
    }

    public Page<StoreListResult> findStores(final Pageable pageable) {
        validatePageRequest(pageable);

        Page<Store> stores = storeJpaRepository.findAll(pageable);
        Map<Long, StoreDetail> storeDetails = findStoreDetails(stores);

        return stores.map(store -> StoreListResult.of(store, getStoreDetail(storeDetails, store.getId())));
    }

    public StoreDetailResult getStore(final Long storeId) {
        Store store = storeJpaRepository.getById(storeId);
        StoreDetail storeDetail = storeDetailJpaRepository.getByStoreId(storeId);
        List<StoreImage> storeImages = storeImageJpaRepository.findAllByStoreId(storeId);

        return StoreDetailResult.of(store, storeDetail, storeImages);
    }

    public Slice<StoreDetail> findStoresWithInstagram(Pageable pageable) {
        return storeDetailJpaRepository.findAllByInstagramIdIsNotNull(pageable);
    }

    private Map<Long, StoreDetail> findStoreDetails(final Page<Store> stores) {
        List<Long> storeIds = stores.stream()
                .map(Store::getId)
                .toList();

        return storeDetailJpaRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(StoreDetail::getId, storeDetail -> storeDetail));
    }

    private StoreDetail getStoreDetail(final Map<Long, StoreDetail> storeDetails, final Long storeId) {
        StoreDetail storeDetail = storeDetails.get(storeId);
        if (storeDetail == null) {
            throw new StoreNotFoundException(ErrorCode.STORE_NOT_FOUND);
        }
        return storeDetail;
    }

    private void validatePageRequest(final Pageable pageable) {
        if (pageable.getPageNumber() < 0 || pageable.getPageSize() <= 0) {
            throw new InvalidPageRequestException(ErrorCode.INVALID_PAGE_REQUEST);
        }
    }

    private void validateNearbyRequest(
            final Double latitude,
            final Double longitude,
            final Integer radius,
            final Integer floor
    ) {
        if (latitude == null || !Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new InvalidNearbyRequestException(ErrorCode.INVALID_NEARBY_REQUEST);
        }
        if (longitude == null || !Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new InvalidNearbyRequestException(ErrorCode.INVALID_NEARBY_REQUEST);
        }
        if (radius == null || radius < MIN_SEARCH_RADIUS || radius > MAX_SEARCH_RADIUS) {
            throw new InvalidNearbyRequestException(ErrorCode.INVALID_NEARBY_REQUEST);
        }
        if (floor != null && floor == 0) {
            throw new InvalidNearbyRequestException(ErrorCode.INVALID_NEARBY_REQUEST);
        }
    }
}
