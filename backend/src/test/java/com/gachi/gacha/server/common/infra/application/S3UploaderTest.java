package com.gachi.gacha.server.common.infra.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@ExtendWith(MockitoExtension.class)
class S3UploaderTest {

    @Mock
    private S3Client s3Client;

    private S3Uploader s3Uploader() {
        S3Uploader s3Uploader = new S3Uploader(s3Client);
        ReflectionTestUtils.setField(s3Uploader, "bucket", "test-bucket");
        return s3Uploader;
    }

    @Test
    @DisplayName("upload는 UUID + 확장자로 키를 만들고, contentDisposition이 있으면 그대로 설정한다.")
    void upload_withContentDisposition() {
        // given
        S3Uploader s3Uploader = s3Uploader();
        RequestBody body = RequestBody.fromBytes(new byte[]{1, 2, 3});

        // when
        String result = s3Uploader.upload(body, "gachigacha/chat", "pdf", "application/pdf", "attachment");

        // then
        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(captor.capture(), any(RequestBody.class));
        PutObjectRequest request = captor.getValue();
        assertThat(request.bucket()).isEqualTo("test-bucket");
        assertThat(request.key()).startsWith("gachigacha/chat/").endsWith(".pdf");
        assertThat(request.contentType()).isEqualTo("application/pdf");
        assertThat(request.contentDisposition()).isEqualTo("attachment");
        assertThat(result).startsWith("https://test-bucket.s3.amazonaws.com/gachigacha/chat/").endsWith(".pdf");
    }

    @Test
    @DisplayName("upload는 contentDisposition이 null이면 헤더 자체를 붙이지 않는다.")
    void upload_withoutContentDisposition() {
        // given
        S3Uploader s3Uploader = s3Uploader();
        RequestBody body = RequestBody.fromBytes(new byte[]{1, 2, 3});

        // when
        s3Uploader.upload(body, "gachigacha/store", "png", "image/png", null);

        // then
        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(captor.capture(), any(RequestBody.class));
        assertThat(captor.getValue().contentDisposition()).isNull();
    }

    @Test
    @DisplayName("moveToTrash는 최상위 폴더는 유지하고 그 다음 위치에 trash를 끼워 넣은 키로 복사 후 원본을 삭제한다.")
    void moveToTrash_storePath() {
        // given
        S3Uploader s3Uploader = s3Uploader();
        String fileUrl = "https://test-bucket.s3.amazonaws.com/gachigacha/store/abc-123.png";

        // when
        s3Uploader.moveToTrash(fileUrl);

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
        S3Uploader s3Uploader = s3Uploader();
        String fileUrl = "https://test-bucket.s3.amazonaws.com/gachigacha/gacha/xyz-789.jpg";

        // when
        s3Uploader.moveToTrash(fileUrl);

        // then
        ArgumentCaptor<CopyObjectRequest> copyCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).copyObject(copyCaptor.capture());
        assertThat(copyCaptor.getValue().destinationKey()).isEqualTo("gachigacha/trash/gacha/xyz-789.jpg");
    }

    @Test
    @DisplayName("delete는 URL에서 key를 뽑아 그대로 삭제 요청을 보낸다.")
    void delete_extractsKeyFromUrl() {
        // given
        S3Uploader s3Uploader = s3Uploader();
        String fileUrl = "https://test-bucket.s3.amazonaws.com/gachigacha/chat/file.pdf";

        // when
        s3Uploader.delete(fileUrl);

        // then
        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(captor.capture());
        assertThat(captor.getValue().key()).isEqualTo("gachigacha/chat/file.pdf");
    }
}
