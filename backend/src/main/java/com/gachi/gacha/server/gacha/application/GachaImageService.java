package com.gachi.gacha.server.gacha.application;

import com.gachi.gacha.server.common.infra.domain.ImageType;
import com.gachi.gacha.server.common.infra.application.ImageUploader;
import com.gachi.gacha.server.common.util.S3TransactionManager;
import com.gachi.gacha.server.gacha.application.dto.GachaImageInfo;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaImage;
import com.gachi.gacha.server.gacha.domain.GachaImageJpaRepository;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GachaImageService {

    private final ImageUploader imageUploader;
    private final S3TransactionManager s3TransactionManager;
    private final GachaJpaRepository gachaRepository;
    private final GachaImageJpaRepository gachaImageRepository;

    @Value("${cloud.aws.s3.folder}")
    private String s3RootFolder;

    public List<GachaImageInfo> findImages(final Long gachaId) {
        Gacha gacha = gachaRepository.getById(gachaId);

        return gachaImageRepository.findAllByGachaId(gacha.getId()).stream()
                .map(GachaImageInfo::from)
                .toList();
    }

    @Transactional
    public List<GachaImageInfo> addImage(final Long gachaId, final List<MultipartFile> files) {
        Gacha gacha = gachaRepository.getById(gachaId);

        List<String> uploadedImageUrls = new ArrayList<>();
        s3TransactionManager.deleteImagesOnRollback(ImageType.GACHA, gachaId, uploadedImageUrls);

        List<GachaImage> gachaImages = files.stream()
                .map(file -> {
                    String imageUrl = imageUploader.upload(file, imagePath());
                    uploadedImageUrls.add(imageUrl);
                    return new GachaImage(gacha, imageUrl);
                })
                .toList();

        List<GachaImage> savedGachaImages = gachaImageRepository.saveAll(gachaImages);
        return savedGachaImages.stream()
                .map(GachaImageInfo::from)
                .toList();
    }

    @Transactional
    public GachaImageInfo modifyImage(final Long gachaId, final Long imageId, final MultipartFile file) {
        GachaImage gachaImage = gachaImageRepository.getByIdAndGachaId(imageId, gachaId);

        String oldImageUrl = gachaImage.getImageUrl();
        String newImageUrl = imageUploader.upload(file, imagePath());

        gachaImage.changeImageUrl(newImageUrl);
        s3TransactionManager.cleanupAfterImageReplaced(ImageType.GACHA, gachaId, oldImageUrl, newImageUrl);

        return GachaImageInfo.from(gachaImage);
    }

    @Transactional
    public Long removeImage(final Long gachaId, final Long imageId) {
        GachaImage gachaImage = gachaImageRepository.getByIdAndGachaId(imageId, gachaId);

        gachaImageRepository.delete(gachaImage);
        s3TransactionManager.trashImagesAfterRemoved(ImageType.GACHA, gachaId, List.of(gachaImage.getImageUrl()));

        return gachaImage.getId();
    }

    private String imagePath() {
        return "%s/%s".formatted(s3RootFolder, ImageType.GACHA.getFolderName());
    }
}
