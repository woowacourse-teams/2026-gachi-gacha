package com.gachi.gacha.server.common.infra.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.infra.exception.ImageInvalidValueException;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@ExtendWith(MockitoExtension.class)
class ImageUploaderTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private RestTemplate restTemplate;

    private ImageUploader imageUploader() {
        ImageUploader imageUploader = new ImageUploader(s3Client, restTemplate);
        ReflectionTestUtils.setField(imageUploader, "bucket", "test-bucket");
        return imageUploader;
    }

    @Test
    @DisplayName("moveToTrash는 최상위 폴더는 유지하고 그 다음 위치에 trash를 끼워 넣은 키로 복사 후 원본을 삭제한다.")
    void moveToTrash_storePath() {
        // given
        ImageUploader imageUploader = imageUploader();
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
        ImageUploader imageUploader = imageUploader();
        String imageUrl = "https://test-bucket.s3.amazonaws.com/gachigacha/gacha/xyz-789.jpg";

        // when
        imageUploader.moveToTrash(imageUrl);

        // then
        ArgumentCaptor<CopyObjectRequest> copyCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).copyObject(copyCaptor.capture());
        assertThat(copyCaptor.getValue().destinationKey()).isEqualTo("gachigacha/trash/gacha/xyz-789.jpg");
    }

    @Test
    @DisplayName("uploadFromUrl은 원본 URL의 이미지를 내려받아 content-type에 맞는 확장자로 S3에 업로드한다.")
    void uploadFromUrl_success() {
        // given
        byte[] body = {1, 2, 3};
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(body);
        when(restTemplate.getForEntity("https://cdn.instagram.com/photo", byte[].class)).thenReturn(response);
        ImageUploader imageUploader = imageUploader();

        // when
        String result = imageUploader.uploadFromUrl("https://cdn.instagram.com/photo", "gachigacha/gacha");

        // then
        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));
        PutObjectRequest putRequest = requestCaptor.getValue();
        assertThat(putRequest.bucket()).isEqualTo("test-bucket");
        assertThat(putRequest.contentType()).isEqualTo("image/jpeg");
        assertThat(putRequest.key()).startsWith("gachigacha/gacha/").endsWith(".jpg");
        assertThat(result).startsWith("https://test-bucket.s3.amazonaws.com/gachigacha/gacha/").endsWith(".jpg");
    }

    @Test
    @DisplayName("허용되지 않은 content-type이면 S3에 업로드하지 않고 예외를 던진다.")
    void uploadFromUrl_invalidContentType_throws() {
        // given
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(new byte[]{1, 2, 3});
        when(restTemplate.getForEntity("https://cdn.instagram.com/photo", byte[].class)).thenReturn(response);
        ImageUploader imageUploader = imageUploader();

        // when & then
        assertThatThrownBy(() -> imageUploader.uploadFromUrl("https://cdn.instagram.com/photo", "gachigacha/gacha"))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("응답 body가 비어있으면 S3에 업로드하지 않고 예외를 던진다.")
    void uploadFromUrl_emptyBody_throws() {
        // given
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(new byte[0]);
        when(restTemplate.getForEntity("https://cdn.instagram.com/photo", byte[].class)).thenReturn(response);
        ImageUploader imageUploader = imageUploader();

        // when & then
        assertThatThrownBy(() -> imageUploader.uploadFromUrl("https://cdn.instagram.com/photo", "gachigacha/gacha"))
                .isInstanceOf(S3Exception.class);
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("원본 이미지 다운로드가 실패하면 S3에 업로드하지 않고 예외를 던진다.")
    void uploadFromUrl_downloadFails_throws() {
        // given
        when(restTemplate.getForEntity("https://cdn.instagram.com/dead-link", byte[].class))
                .thenThrow(HttpClientErrorException.create(HttpStatus.NOT_FOUND, "Not Found", null, null, null));
        ImageUploader imageUploader = imageUploader();

        // when & then
        assertThatThrownBy(() -> imageUploader.uploadFromUrl("https://cdn.instagram.com/dead-link", "gachigacha/gacha"))
                .isInstanceOf(S3Exception.class);
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }
}
