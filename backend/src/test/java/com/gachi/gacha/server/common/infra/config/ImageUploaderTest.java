package com.gachi.gacha.server.common.infra.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ImageUploaderTest {

    @Mock
    private S3Client s3Client;

    @Test
    @DisplayName("moveToTrash는 최상위 폴더는 유지하고 그 다음 위치에 trash를 끼워 넣은 키로 복사 후 원본을 삭제한다.")
    void moveToTrash_storePath() {
        // given
        ImageUploader imageUploader = new ImageUploader(s3Client);
        ReflectionTestUtils.setField(imageUploader, "bucket", "test-bucket");
        String imageUrl = "https://test-bucket.s3.amazonaws.com/gachigacha/store/abc-123.png";

        // when
        imageUploader.moveToTrash(imageUrl);

        // then
        ArgumentCaptor<CopyObjectRequest> copyCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).copyObject(copyCaptor.capture());
        CopyObjectRequest copyRequest = copyCaptor.getValue();
        assertThat(copyRequest.sourceBucket()).isEqualTo("test-bucket");
        assertThat(copyRequest.sourceKey()).isEqualTo("gachigacha/store/abc-123.png");
        assertThat(copyRequest.destinationBucket()).isEqualTo("test-bucket");
        assertThat(copyRequest.destinationKey()).isEqualTo("gachigacha/trash/store/abc-123.png");

        ArgumentCaptor<DeleteObjectRequest> deleteCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(deleteCaptor.capture());
        assertThat(deleteCaptor.getValue().key()).isEqualTo("gachigacha/store/abc-123.png");
    }

    @Test
    @DisplayName("가챠 이미지 경로도 동일한 규칙으로 trash 키를 만든다.")
    void moveToTrash_gachaPath() {
        // given
        ImageUploader imageUploader = new ImageUploader(s3Client);
        ReflectionTestUtils.setField(imageUploader, "bucket", "test-bucket");
        String imageUrl = "https://test-bucket.s3.amazonaws.com/gachigacha/gacha/xyz-789.jpg";

        // when
        imageUploader.moveToTrash(imageUrl);

        // then
        ArgumentCaptor<CopyObjectRequest> copyCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).copyObject(copyCaptor.capture());
        assertThat(copyCaptor.getValue().destinationKey()).isEqualTo("gachigacha/trash/gacha/xyz-789.jpg");
    }
}
