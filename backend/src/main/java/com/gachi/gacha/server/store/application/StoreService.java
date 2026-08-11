package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.store.application.dto.StoreCreateCommand;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.application.dto.StoreUpdateCommand;
import com.gachi.gacha.server.store.application.dto.StoreUpdateResult;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetailUpdate;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreService {

    private static final double EARTH_RADIUS_METERS = 6_371_000;
    private static final double METERS_PER_LATITUDE_DEGREE = 111_320;
    private static final int MIN_SEARCH_RADIUS = 100;
    private static final int MAX_SEARCH_RADIUS = 20_000;

    private final StoreJpaRepository storeJpaRepository;

    @Transactional(readOnly = true)
    public StoreNearbyResult findNearbyStores(Double latitude, Double longitude, Integer radius) {
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

    private void validateNearbyRequest(Double latitude, Double longitude, Integer radius) {
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

    private StoreDistance createStoreDistance(Store store, Double latitude, Double longitude) {
        double distance = calculateDistance(
                latitude,
                longitude,
                store.getLatitude(),
                store.getLongitude()
        );
        return new StoreDistance(store, distance);
    }

    private double calculateDistance(
            Double originLatitude,
            Double originLongitude,
            Double targetLatitude,
            Double targetLongitude
    ) {
        double latitudeDistance = Math.toRadians(targetLatitude - originLatitude);
        double longitudeDistance = Math.toRadians(targetLongitude - originLongitude);
        double originLatitudeRadian = Math.toRadians(originLatitude);
        double targetLatitudeRadian = Math.toRadians(targetLatitude);

        double haversine = Math.pow(Math.sin(latitudeDistance / 2), 2)
                + Math.cos(originLatitudeRadian)
                * Math.cos(targetLatitudeRadian)
                * Math.pow(Math.sin(longitudeDistance / 2), 2);
        double normalizedHaversine = Math.min(1, Math.max(0, haversine));
        double angularDistance = 2 * Math.atan2(
                Math.sqrt(normalizedHaversine),
                Math.sqrt(1 - normalizedHaversine)
        );

        return EARTH_RADIUS_METERS * angularDistance;
    }

    @Transactional(readOnly = true)
    public StoreListResult findStores(int page, int size) {
        validatePageRequest(page, size);

        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "id")
        );
        Page<Store> stores = storeJpaRepository.findAll(pageRequest);

        return StoreListResult.from(stores);
    }

    private void validatePageRequest(int page, int size) {
        if (page < 0 || size <= 0) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    @Transactional(readOnly = true)
    public StoreDetailResult getStore(Long storeId) {
        Store store = storeJpaRepository.findById(storeId)
                .orElseThrow(StoreNotFoundException::new);

        return StoreDetailResult.from(store);
    }

    @Transactional
    public StoreCreateResult addStore(StoreCreateCommand command) {
        Store store = command.toEntity();
        Store savedStore = storeJpaRepository.save(store);
        return StoreCreateResult.from(savedStore);
    }

    @Transactional
    public StoreUpdateResult modifyStore(Long storeId, StoreUpdateCommand command) {
        Store store = storeJpaRepository.findById(storeId)
                .orElseThrow(StoreNotFoundException::new);

        store.modify(
                command.thumbnailUrl(),
                command.latitude(),
                command.longitude()
        );
        store.getStoreDetail().modify(createStoreDetailUpdate(command));
        storeJpaRepository.flush();

        return StoreUpdateResult.from(store);
    }

    private StoreDetailUpdate createStoreDetailUpdate(StoreUpdateCommand command) {
        return new StoreDetailUpdate(
                command.name(),
                command.address(),
                command.businessHours(),
                command.paymentMethods(),
                command.phoneNumber(),
                command.facilities(),
                command.instagramId(),
                command.gachaMachineCount(),
                command.kujiCount(),
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
    public Long removeStore(Long storeId) {
        Store store = storeJpaRepository.findById(storeId)
                .orElseThrow(StoreNotFoundException::new);

        storeJpaRepository.delete(store);

        return storeId;
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
