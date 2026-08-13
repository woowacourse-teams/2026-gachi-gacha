package com.gachi.gacha.server.common.util;

import com.gachi.gacha.server.common.infra.config.ImageType;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * S3는 트랜잭션 매니저가 관리하는 리소스가 아니라서, DB 트랜잭션의 커밋/롤백 결과가 확정된 이후에만 S3 작업(휴지통 이동/삭제)이 실행되도록 미루는 역할을 한다. 커밋 전에 S3를 먼저 건드리면, 이후
 * DB 작업이 실패해 롤백될 때 "DB는 되돌아갔는데 S3는 이미 바뀐" 깨진 참조 상태가 생길 수 있다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class S3TransactionManager {

    private final ImageUploader imageUploader;

    /**
     * 이미지 1장을 새 파일로 교체(수정)할 때 사용. 커밋되면 옛 이미지를 휴지통으로 이동하고, 롤백되면 방금 올린 새 이미지를 삭제한다.
     */
    public void cleanupAfterImageReplaced(
            final ImageType imageType,
            final Long domainId,
            final String oldImageUrl,
            final String newImageUrl
    ) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(final int status) {
                if (status == TransactionSynchronization.STATUS_COMMITTED) {
                    moveImageToTrash(imageType, domainId, oldImageUrl);
                } else {
                    deleteImage(imageType, domainId, newImageUrl);
                }
            }
        });
    }

    /**
     * 소유 엔티티(매장/가챠) 자체가 삭제될 때, 딸린 이미지들을 휴지통으로 이동. 복구 가능성이 남아있어야 하는 경우(예: 가챠 삭제)에 사용.
     */
    public void trashImagesAfterRemoved(
            final ImageType imageType,
            final Long domainId,
            final List<String> imageUrls
    ) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                imageUrls.forEach(imageUrl -> moveImageToTrash(imageType, domainId, imageUrl));
            }
        });
    }

    /**
     * 소유 엔티티(매장/가챠) 자체가 삭제될 때, 딸린 이미지들을 완전 삭제. 복구가 무의미한 경우(예: 매장 삭제 - DB row 자체가 없어져서 복구 불가)에 사용.
     */
    public void deleteImagesAfterRemoved(
            final ImageType imageType,
            final Long domainId,
            final List<String> imageUrls
    ) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                imageUrls.forEach(imageUrl -> deleteImage(imageType, domainId, imageUrl));
            }
        });
    }

    private void moveImageToTrash(final ImageType imageType, final Long domainId, final String imageUrl) {
        try {
            imageUploader.moveToTrash(imageUrl);
        } catch (final S3Exception e) {
            log.warn("{} 이미지를 휴지통으로 이동하는 데 실패했습니다. domainId={}, imageUrl={}",
                    imageType.getLabel(), domainId, imageUrl, e);
        }
    }

    private void deleteImage(final ImageType imageType, final Long domainId, final String imageUrl) {
        try {
            imageUploader.delete(imageUrl);
        } catch (final S3Exception e) {
            log.warn("{} 이미지 삭제에 실패했습니다. domainId={}, imageUrl={}",
                    imageType.getLabel(), domainId, imageUrl, e);
        }
    }
}
