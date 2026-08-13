package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.store.application.dto.StoreImageInfo;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreImage;
import com.gachi.gacha.server.store.domain.StoreImageJpaRepository;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreImageService {

    private static final String STORE_IMAGE_FOLDER = "store";

    private final ImageUploader imageUploader;
    private final StoreJpaRepository storeRepository;
    private final StoreImageJpaRepository storeImageRepository;

    @Value("${cloud.aws.s3.folder}")
    private String s3RootFolder;

    public List<StoreImageInfo> findImages(final Long storeId) {
        Store store = storeRepository.getById(storeId);

        return storeImageRepository.findAllByStoreId(store.getId()).stream()
                .map(StoreImageInfo::from)
                .toList();
    }

    @Transactional
    public List<StoreImageInfo> addImage(final Long storeId, final List<MultipartFile> files) {
        Store store = storeRepository.getById(storeId);

        List<String> uploadedImageUrls = new ArrayList<>();
        try {
            List<StoreImage> storeImages = files.stream()
                    .map(file -> {
                        String imageUrl = imageUploader.upload(file, imagePath());
                        uploadedImageUrls.add(imageUrl);
                        return new StoreImage(store, imageUrl);
                    })
                    .toList();

            List<StoreImage> savedStoreImages = storeImageRepository.saveAll(storeImages);
            return savedStoreImages.stream()
                    .map(StoreImageInfo::from)
                    .toList();
        } catch (RuntimeException e) {
            uploadedImageUrls.forEach(imageUploader::delete);
            throw e;
        }
    }

    @Transactional
    public StoreImageInfo modifyImage(final Long storeId, final Long imageId, final MultipartFile file) {
        StoreImage storeImage = storeImageRepository.getByIdAndStoreId(imageId, storeId);

        String oldImageUrl = storeImage.getImageUrl();
        String newImageUrl = imageUploader.upload(file, imagePath());

        storeImage.changeImageUrl(newImageUrl);
        registerImageSwapCleanupAfterCompletion(storeId, oldImageUrl, newImageUrl);

        return StoreImageInfo.from(storeImage);
    }

    @Transactional
    public Long removeImage(final Long storeId, final Long imageId) {
        StoreImage storeImage = storeImageRepository.getByIdAndStoreId(imageId, storeId);

        imageUploader.moveToTrash(storeImage.getImageUrl());
        storeImageRepository.delete(storeImage);

        return storeImage.getId();
    }

    private String imagePath() {
        return "%s/%s".formatted(s3RootFolder, STORE_IMAGE_FOLDER);
    }

    private void registerImageSwapCleanupAfterCompletion(final Long storeId, final String oldImageUrl, final String newImageUrl) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(final int status) {
                if (status == TransactionSynchronization.STATUS_COMMITTED) {
                    moveToTrashQuietly(storeId, oldImageUrl);
                } else {
                    deleteQuietly(storeId, newImageUrl);
                }
            }
        });
    }

    private void moveToTrashQuietly(final Long storeId, final String imageUrl) {
        try {
            imageUploader.moveToTrash(imageUrl);
        } catch (final S3Exception e) {
            log.warn("매장 이미지 수정 후 옛 이미지를 휴지통으로 이동하는 데 실패했습니다. storeId={}, imageUrl={}", storeId, imageUrl, e);
        }
    }

    private void deleteQuietly(final Long storeId, final String imageUrl) {
        try {
            imageUploader.delete(imageUrl);
        } catch (final S3Exception e) {
            log.warn("매장 이미지 수정 롤백 중 새 이미지 삭제에 실패했습니다. storeId={}, imageUrl={}", storeId, imageUrl, e);
        }
    }
}
