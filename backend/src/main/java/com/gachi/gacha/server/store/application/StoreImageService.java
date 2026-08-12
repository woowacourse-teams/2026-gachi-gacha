package com.gachi.gacha.server.store.application;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.store.application.dto.StoreImageInfo;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreImage;
import com.gachi.gacha.server.store.domain.StoreImageJpaRepository;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.infra.config.ImageUploader;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.STORE_NOT_FOUND));

        return storeImageRepository.findAllByStoreId(store.getId()).stream()
                .map(StoreImageInfo::from)
                .toList();
    }

    @Transactional
    public StoreImageInfo addImage(final Long storeId, final MultipartFile file) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.STORE_NOT_FOUND));

        String imageUrl = imageUploader.upload(file, imagePath());
        StoreImage storeImage = new StoreImage(store, imageUrl);
        StoreImage savedStoreImage = storeImageRepository.save(storeImage);

        return StoreImageInfo.from(savedStoreImage);
    }

    @Transactional
    public StoreImageInfo modifyImage(final Long storeId, final Long imageId, final MultipartFile file) {
        StoreImage storeImage = storeImageRepository.getByIdAndStoreId(imageId, storeId);

        String oldImageUrl = storeImage.getImageUrl();
        String newImageUrl = imageUploader.upload(file, imagePath());

        storeImage.changeImageUrl(newImageUrl);
        imageUploader.delete(oldImageUrl);

        return StoreImageInfo.from(storeImage);
    }

    @Transactional
    public Long removeImage(final Long storeId, final Long imageId) {
        StoreImage storeImage = storeImageRepository.getByIdAndStoreId(imageId, storeId);

        imageUploader.delete(storeImage.getImageUrl());
        storeImageRepository.delete(storeImage);

        return storeImage.getId();
    }

    private String imagePath() {
        return "%s/%s".formatted(s3RootFolder, STORE_IMAGE_FOLDER);
    }
}
