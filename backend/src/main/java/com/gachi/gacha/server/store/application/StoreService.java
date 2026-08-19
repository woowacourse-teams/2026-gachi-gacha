package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import com.gachi.gacha.server.common.infra.config.ImageType;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.common.util.S3TransactionManager;
import com.gachi.gacha.server.store.application.dto.StoreCreateCommand;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreDeleteResult;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.application.dto.StoreUpdateCommand;
import com.gachi.gacha.server.store.application.dto.StoreUpdateResult;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;
import com.gachi.gacha.server.store.domain.StoreDetailJpaRepository;
import com.gachi.gacha.server.store.domain.StoreDetailUpdate;
import com.gachi.gacha.server.store.domain.StoreImage;
import com.gachi.gacha.server.store.domain.StoreImageJpaRepository;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.domain.exception.InvalidNearbyRequestException;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StoreService {

    private static final double METERS_PER_LATITUDE_DEGREE = 111_320;
    private static final int MIN_SEARCH_RADIUS = 100;
    private static final int MAX_SEARCH_RADIUS = 20_000;

    private final StoreJpaRepository storeJpaRepository;
    private final StoreDetailJpaRepository storeDetailJpaRepository;
    private final StoreImageJpaRepository storeImageJpaRepository;
    private final S3TransactionManager s3TransactionManager;
    private final ImageUploader imageUploader;

    @Value("${cloud.aws.s3.folder}")
    private String s3RootFolder;

    public StoreNearbyResult findNearbyStores(
            final Double latitude,
            final Double longitude,
            final Integer radius
    ) {
        validateNearbyRequest(latitude, longitude, radius);

        List<StoreJpaRepository.StoreWithDistance> nearbyStores = storeJpaRepository.findNearbyStores(latitude, longitude, radius);

        List<StoreNearbyResult.StoreInfo> storeInfos = nearbyStores.stream()
                .map(result -> StoreNearbyResult.StoreInfo.builder()
                        .storeId(result.getStoreId())
                        .thumbnailUrl(result.getThumbnailUrl())
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

    @Transactional
    public StoreCreateResult addStore(final StoreCreateCommand command, final List<MultipartFile> images) {
        Store store = command.toStore();
        Store savedStore = storeJpaRepository.save(store);
        storeDetailJpaRepository.save(command.toStoreDetail(savedStore));
        saveStoreImages(savedStore, images);

        return StoreCreateResult.from(savedStore);
    }

    @Transactional
    public StoreUpdateResult modifyStore(final Long storeId, final StoreUpdateCommand command) {
        Store store = storeJpaRepository.getById(storeId);
        StoreDetail storeDetail = storeDetailJpaRepository.getByStoreId(storeId);

        Store patchedStore = store.patch(
                command.thumbnailUrl(),
                command.latitude(),
                command.longitude()
        );
        Store savedStore = storeJpaRepository.save(patchedStore);
        StoreDetail patchedDetail = storeDetail.patch(createStoreDetailUpdate(command));
        StoreDetail savedDetail = storeDetailJpaRepository.save(patchedDetail);
        storeJpaRepository.flush();

        return StoreUpdateResult.of(savedStore, savedDetail);
    }

    @Transactional
    public StoreDeleteResult removeStore(final Long storeId) {
        Store store = storeJpaRepository.getById(storeId);
        StoreDetail storeDetail = storeDetailJpaRepository.getByStoreId(storeId);
        List<StoreImage> storeImages = storeImageJpaRepository.findAllByStoreId(storeId);

        storeImageJpaRepository.deleteAllByStoreId(storeId);
        storeDetailJpaRepository.delete(storeDetail);
        storeJpaRepository.delete(store);

        List<String> imageUrls = storeImages.stream().map(StoreImage::getImageUrl).toList();
        s3TransactionManager.deleteImagesAfterRemoved(ImageType.STORE, storeId, imageUrls);

        return StoreDeleteResult.from(store);
    }

    public Store findByStoreId(final Long storeId) {
        return storeJpaRepository.getById(storeId);
    }

    private void saveStoreImages(final Store store, final List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        List<String> uploadedImageUrls = new ArrayList<>();
        s3TransactionManager.deleteImagesOnRollback(ImageType.STORE, store.getId(), uploadedImageUrls);

        List<StoreImage> storeImages = images.stream()
                .map(file -> {
                    String imageUrl = imageUploader.upload(file, imagePath());
                    uploadedImageUrls.add(imageUrl);
                    return new StoreImage(store, imageUrl);
                })
                .toList();

        storeImageJpaRepository.saveAll(storeImages);
    }

    private String imagePath() {
        return "%s/%s".formatted(s3RootFolder, ImageType.STORE.getFolderName());
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

    private void validateNearbyRequest(
            final Double latitude,
            final Double longitude,
            final Integer radius
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
    }
}
