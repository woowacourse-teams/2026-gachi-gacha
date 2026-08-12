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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class StoreImageService {

    private static final String IMAGE_PATH = "gachi-gacha/store";

    private final ImageUploader imageUploader;
    private final StoreJpaRepository storeRepository;
    private final StoreImageJpaRepository storeImageRepository;

    @Transactional(readOnly = true)
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

        String imageUrl = imageUploader.upload(file, IMAGE_PATH);
        StoreImage storeImage = new StoreImage(store, imageUrl);
        StoreImage savedStoreImage = storeImageRepository.save(storeImage);

        return StoreImageInfo.from(savedStoreImage);
    }

    @Transactional
    public StoreImageInfo modifyImage(final Long storeId, final Long imageId, final MultipartFile file) {
        StoreImage storeImage = storeImageRepository.getByIdAndStoreId(imageId, storeId);

        String oldImageUrl = storeImage.getImageUrl();
        String newImageUrl = imageUploader.upload(file, IMAGE_PATH);

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
}
