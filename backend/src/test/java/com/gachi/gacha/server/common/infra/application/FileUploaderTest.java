package com.gachi.gacha.server.common.infra.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.infra.exception.FileInvalidValueException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;

@ExtendWith(MockitoExtension.class)
class FileUploaderTest {

    @Mock
    private S3Uploader s3Uploader;

    private FileUploader fileUploader() {
        return new FileUploader(s3Uploader);
    }

    @Test
    @DisplayName("image/*(svg 제외) 파일은 contentDisposition을 null(인라인)로 넘긴다.")
    void upload_image_inlinesContentDisposition() {
        // given
        FileUploader fileUploader = fileUploader();
        MultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[]{1, 2, 3});
        when(s3Uploader.upload(any(RequestBody.class), eq("gachigacha/chat"), eq("png"), eq("image/png"), isNull()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/chat/uuid.png");

        // when
        String result = fileUploader.upload(file, "gachigacha/chat");

        // then
        assertThat(result).isEqualTo("https://test-bucket.s3.amazonaws.com/gachigacha/chat/uuid.png");
    }

    @Test
    @DisplayName("이미지가 아닌 파일은 contentDisposition을 attachment로 넘긴다.")
    void upload_nonImage_attachesContentDisposition() {
        // given
        FileUploader fileUploader = fileUploader();
        MultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1, 2, 3});
        when(s3Uploader.upload(any(RequestBody.class), eq("gachigacha/chat"), eq("pdf"), eq("application/pdf"), eq("attachment")))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/chat/uuid.pdf");

        // when
        String result = fileUploader.upload(file, "gachigacha/chat");

        // then
        assertThat(result).isEqualTo("https://test-bucket.s3.amazonaws.com/gachigacha/chat/uuid.pdf");
    }

    @Test
    @DisplayName("content-type이 image/svg+xml이면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void upload_svgContentType_throws() {
        // given
        FileUploader fileUploader = fileUploader();
        MultipartFile file = new MockMultipartFile("file", "logo.svg", "image/svg+xml", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> fileUploader.upload(file, "gachigacha/chat"))
                .isInstanceOf(FileInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("확장자가 svg면 content-type을 위장해도 예외를 던진다.")
    void upload_svgExtension_throwsEvenWithSpoofedContentType() {
        // given
        FileUploader fileUploader = fileUploader();
        MultipartFile file = new MockMultipartFile("file", "logo.svg", "image/png", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> fileUploader.upload(file, "gachigacha/chat"))
                .isInstanceOf(FileInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("확장자가 없는 파일명은 예외를 던진다.")
    void upload_noExtension_throws() {
        // given
        FileUploader fileUploader = fileUploader();
        MultipartFile file = new MockMultipartFile("file", "no-extension", "application/pdf", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> fileUploader.upload(file, "gachigacha/chat"))
                .isInstanceOf(FileInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }
}
