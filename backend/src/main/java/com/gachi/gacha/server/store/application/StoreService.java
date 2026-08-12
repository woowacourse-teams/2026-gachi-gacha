package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.store.application.dto.StoreCreateCommand;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreDeleteResult;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.application.dto.StoreUpdateCommand;
import com.gachi.gacha.server.store.application.dto.StoreUpdateResult;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetailUpdate;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import net.sf.geographiclib.Geodesic;
import net.sf.geographiclib.GeodesicData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StoreService {

    private static final double METERS_PER_LATITUDE_DEGREE = 111_320;
    private static final int MIN_SEARCH_RADIUS = 100;
    private static final int MAX_SEARCH_RADIUS = 20_000;

    private final StoreJpaRepository storeJpaRepository;

    public StoreNearbyResult findNearbyStores(
            final Double latitude,
            final Double longitude,
            final Integer radius
    ) {
        validateNearbyRequest(latitude, longitude, radius);

        double latitudeDelta = radius / METERS_PER_LATITUDE_DEGREE;
        double minLatitude = Math.max(-90, latitude - latitudeDelta);
        double maxLatitude = Math.min(90, latitude + latitudeDelta);

        List<StoreNearbyResult.StoreInfo> stores = storeJpaRepository
                .findAllByLatitudeBetween(minLatitude, maxLatitude).stream()
                .map(store -> createStoreDistance(store, latitude, longitude))
                .filter(storeDistance -> storeDistance.distance() <= radius)
                .sorted(Comparator.comparingDouble(StoreDistance::distance)
                        .thenComparing(storeDistance -> storeDistance.store().getId()))
                .map(StoreDistance::toStoreInfo)
                .toList();

        return StoreNearbyResult.of(latitude, longitude, radius, stores);
    }

    private void validateNearbyRequest(
            final Double latitude,
            final Double longitude,
            final Integer radius
    ) {
        if (latitude == null || !Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
        if (longitude == null || !Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
        if (radius == null || radius < MIN_SEARCH_RADIUS || radius > MAX_SEARCH_RADIUS) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    private StoreDistance createStoreDistance(
            final Store store,
            final Double latitude,
            final Double longitude
    ) {
        double distance = calculateDistance(
                latitude,
                longitude,
                store.getLatitude(),
                store.getLongitude()
        );
        return new StoreDistance(store, distance);
    }

    private double calculateDistance(
            final Double originLatitude,
            final Double originLongitude,
            final Double targetLatitude,
            final Double targetLongitude
    ) {

        GeodesicData result = Geodesic.WGS84.Inverse(
                originLatitude,
                originLongitude,
                targetLatitude,
                targetLongitude
        );

        return result.s12;
    }

    public Page<StoreListResult> findStores(final Pageable pageable) {
        validatePageRequest(pageable);

        return storeJpaRepository.findAll(pageable)
                .map(StoreListResult::from);
    }

    private void validatePageRequest(final Pageable pageable) {
        if (pageable.getPageNumber() < 0 || pageable.getPageSize() <= 0) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    public StoreDetailResult getStore(final Long storeId) {
        Store store = storeJpaRepository.getById(storeId);

        return StoreDetailResult.from(store);
    }

    @Transactional
    public StoreCreateResult addStore(final StoreCreateCommand command) {
        Store store = command.toEntity();
        Store savedStore = storeJpaRepository.save(store);
        return StoreCreateResult.from(savedStore);
    }

    @Transactional
    public StoreUpdateResult modifyStore(final Long storeId, final StoreUpdateCommand command) {
        Store store = storeJpaRepository.getById(storeId);

        store.modify(
                command.thumbnailUrl(),
                command.latitude(),
                command.longitude()
        );
        store.getStoreDetail().modify(createStoreDetailUpdate(command));
        storeJpaRepository.flush();

        return StoreUpdateResult.from(store);
    }

    private StoreDetailUpdate createStoreDetailUpdate(final StoreUpdateCommand command) {
        return new StoreDetailUpdate(
                command.name(),
                command.address(),
                command.businessHours(),
                command.paymentMethods(),
                command.phoneNumber(),
                command.facilities(),
                command.instagramId(),
                command.gachaMachineAmount(),
                command.kujiAmount(),
                command.coinPrice(),
                command.gachaPriceMin(),
                command.gachaPriceMax(),
                command.kujiPriceMin(),
                command.kujiPriceMax(),
                command.selectGachaPriceMin(),
                command.selectGachaPriceMax(),
                command.hasRandomBox(),
                command.hasSelectGacha()
        );
    }

    @Transactional
    public StoreDeleteResult removeStore(final Long storeId) {
        Store store = storeJpaRepository.getById(storeId);

        storeJpaRepository.deleteById(storeId);

        return StoreDeleteResult.from(store);
    }

    private record StoreDistance(
            Store store,
            double distance
    ) {

        private StoreNearbyResult.StoreInfo toStoreInfo() {
            return StoreNearbyResult.StoreInfo.of(store, Math.round(distance));
        }
    }
}
