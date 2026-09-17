package com.gachi.gacha.server.common.infra.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.infra.domain.DomainType;
import com.gachi.gacha.server.common.infra.exception.ImageInvalidValueException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;

@ExtendWith(MockitoExtension.class)
class MultipartUploaderTest {

    @Mock
    private S3Uploader s3Uploader;

    private MultipartUploader multipartUploader() {
        return new MultipartUploader(s3Uploader);
    }

    @Test
    @DisplayName("upload는 검증 후 path/확장자/contentType과 함께 S3Uploader에 위임하고, contentDisposition은 null(인라인)로 넘긴다.")
    void upload_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "photo.png", "image/png", new byte[]{1, 2, 3});
        when(s3Uploader.upload(any(RequestBody.class), eq(DomainType.STORE), eq("png"), eq("image/png"), isNull()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/store/uuid.png");

        // when
        String result = multipartUploader.upload(file, DomainType.STORE);

        // then
        assertThat(result).isEqualTo("https://test-bucket.s3.amazonaws.com/gachigacha/store/uuid.png");
    }

    @Test
    @DisplayName("동영상(mp4)도 화이트리스트에 있으면 정상 업로드된다.")
    void upload_video_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("video", "clip.mp4", "video/mp4", new byte[]{1, 2, 3});
        when(s3Uploader.upload(any(RequestBody.class), eq(DomainType.TRADE), eq("mp4"), eq("video/mp4"), isNull()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/trade/uuid.mp4");

        // when
        String result = multipartUploader.upload(file, DomainType.TRADE);

        // then
        assertThat(result).isEqualTo("https://test-bucket.s3.amazonaws.com/gachigacha/trade/uuid.mp4");
    }

    @Test
    @DisplayName("svg는 화이트리스트에 없어서 확장자·content-type 둘 다 통과하지 못하고 예외를 던진다.")
    void upload_svg_throws() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "logo.svg", "image/svg+xml", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> multipartUploader.upload(file, DomainType.STORE))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("허용되지 않은 확장자면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void upload_invalidExtension_throws() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "malware.exe", "image/png", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> multipartUploader.upload(file, DomainType.STORE))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("허용되지 않은 content-type이면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void upload_invalidContentType_throws() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "photo.png", "text/html", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> multipartUploader.upload(file, DomainType.STORE))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("delete는 그대로 S3Uploader.delete로 위임한다.")
    void delete_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();

        // when
        multipartUploader.delete("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");

        // then
        verify(s3Uploader).delete("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");
    }

    @Test
    @DisplayName("moveToTrash는 그대로 S3Uploader.moveToTrash로 위임한다.")
    void moveToTrash_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();

        // when
        multipartUploader.moveToTrash("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");

        // then
        verify(s3Uploader).moveToTrash("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");
    }
}
