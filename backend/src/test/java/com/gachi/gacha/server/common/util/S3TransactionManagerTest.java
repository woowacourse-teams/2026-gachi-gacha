package com.gachi.gacha.server.common.util;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.common.infra.domain.DomainType;
import com.gachi.gacha.server.common.infra.application.MultipartUploader;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class S3TransactionManagerTest {

    @Mock
    private MultipartUploader multipartUploader;

    private S3TransactionManager s3TransactionManager;

    @BeforeEach
    void setUp() {
        s3TransactionManager = new S3TransactionManager(multipartUploader);
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.clearSynchronization();
    }

    @Nested
    @DisplayName("cleanupAfterImageReplaced")
    class CleanupAfterImageReplaced {

        @Test
        @DisplayName("커밋되면 옛 이미지를 휴지통으로 이동하고, 새 이미지는 건드리지 않는다.")
        void commit_movesOldImageToTrash() {
            // given
            s3TransactionManager.cleanupAfterImageReplaced(DomainType.STORE, 1L, "old-url", "new-url");

            // when
            triggerAfterCompletion(TransactionSynchronization.STATUS_COMMITTED);

            // then
            verify(multipartUploader).moveToTrash("old-url");
            verify(multipartUploader, never()).delete("new-url");
        }

        @Test
        @DisplayName("롤백되면 방금 올린 새 이미지를 삭제하고, 옛 이미지는 건드리지 않는다.")
        void rollback_deletesNewImage() {
            // given
            s3TransactionManager.cleanupAfterImageReplaced(DomainType.STORE, 1L, "old-url", "new-url");

            // when
            triggerAfterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

            // then
            verify(multipartUploader).delete("new-url");
            verify(multipartUploader, never()).moveToTrash("old-url");
        }

        @Test
        @DisplayName("S3 작업이 실패해도 예외가 밖으로 전파되지 않는다.")
        void failure_doesNotPropagate() {
            // given
            doThrow(new RuntimeException("boom")).when(multipartUploader).moveToTrash("old-url");
            s3TransactionManager.cleanupAfterImageReplaced(DomainType.STORE, 1L, "old-url", "new-url");

            // when & then
            assertThatCode(() -> triggerAfterCompletion(TransactionSynchronization.STATUS_COMMITTED))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("trashImagesAfterRemoved")
    class TrashImagesAfterRemoved {

        @Test
        @DisplayName("커밋되면 전달받은 이미지를 전부 휴지통으로 이동한다.")
        void commit_movesAllImagesToTrash() {
            // given
            s3TransactionManager.trashImagesAfterRemoved(DomainType.GACHA, 1L, List.of("url-1", "url-2"));

            // when
            triggerAfterCommit();

            // then
            verify(multipartUploader).moveToTrash("url-1");
            verify(multipartUploader).moveToTrash("url-2");
        }

        @Test
        @DisplayName("롤백되면 아무 작업도 하지 않는다.")
        void rollback_doesNothing() {
            // given
            s3TransactionManager.trashImagesAfterRemoved(DomainType.GACHA, 1L, List.of("url-1"));

            // when
            triggerAfterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

            // then
            verify(multipartUploader, never()).moveToTrash(anyString());
        }
    }

    @Nested
    @DisplayName("deleteImagesAfterRemoved")
    class DeleteImagesAfterRemoved {

        @Test
        @DisplayName("커밋되면 전달받은 이미지를 전부 완전 삭제한다.")
        void commit_deletesAllImages() {
            // given
            s3TransactionManager.deleteImagesAfterRemoved(DomainType.STORE, 1L, List.of("url-1", "url-2"));

            // when
            triggerAfterCommit();

            // then
            verify(multipartUploader).delete("url-1");
            verify(multipartUploader).delete("url-2");
            verify(multipartUploader, never()).moveToTrash(anyString());
        }

        @Test
        @DisplayName("롤백되면 아무 작업도 하지 않는다.")
        void rollback_doesNothing() {
            // given
            s3TransactionManager.deleteImagesAfterRemoved(DomainType.STORE, 1L, List.of("url-1"));

            // when
            triggerAfterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

            // then
            verify(multipartUploader, never()).delete(anyString());
        }
    }

    @Nested
    @DisplayName("deleteImagesOnRollback")
    class DeleteImagesOnRollback {

        @Test
        @DisplayName("커밋되면 아무 작업도 하지 않는다.")
        void commit_doesNothing() {
            // given
            s3TransactionManager.deleteImagesOnRollback(DomainType.STORE, 1L, List.of("url-1"));

            // when
            triggerAfterCompletion(TransactionSynchronization.STATUS_COMMITTED);

            // then
            verify(multipartUploader, never()).delete(anyString());
        }

        @Test
        @DisplayName("롤백되면 그 시점까지 업로드된 이미지를 전부 삭제한다.")
        void rollback_deletesAllUploadedImages() {
            // given: 등록 시점엔 비어있다가, 이후 실제 업로드가 진행되며 채워지는 리스트를 그대로 참조로 넘긴다.
            List<String> uploadedImageUrls = new ArrayList<>();
            s3TransactionManager.deleteImagesOnRollback(DomainType.STORE, 1L, uploadedImageUrls);
            uploadedImageUrls.add("url-1");
            uploadedImageUrls.add("url-2");

            // when
            triggerAfterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

            // then
            verify(multipartUploader).delete("url-1");
            verify(multipartUploader).delete("url-2");
        }

        @Test
        @DisplayName("S3 삭제가 실패해도 예외가 밖으로 전파되지 않는다.")
        void failure_doesNotPropagate() {
            // given
            doThrow(new RuntimeException("boom")).when(multipartUploader).delete("url-1");
            s3TransactionManager.deleteImagesOnRollback(DomainType.STORE, 1L, List.of("url-1"));

            // when & then
            assertThatCode(() -> triggerAfterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK))
                    .doesNotThrowAnyException();
        }
    }

    private void triggerAfterCommit() {
        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
    }

    private void triggerAfterCompletion(final int status) {
        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCompletion(status);
        }
    }
}
