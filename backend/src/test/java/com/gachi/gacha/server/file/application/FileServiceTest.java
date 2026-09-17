package com.gachi.gacha.server.file.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.infra.application.MultipartUploader;
import com.gachi.gacha.server.common.infra.exception.FileInvalidValueException;
import com.gachi.gacha.server.file.application.dto.FileUploadInfo;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private MultipartUploader multipartUploader;

    private FileService fileService() {
        FileService fileService = new FileService(multipartUploader);
        ReflectionTestUtils.setField(fileService, "s3RootFolder", "gachigacha");
        return fileService;
    }

    @Test
    @DisplayName("여러 파일을 순차로 업로드하고, 각 파일의 원본 정보(이름/타입/크기)와 업로드 URL을 함께 반환한다.")
    void uploadFiles_success() {
        // given
        FileService fileService = fileService();
        MultipartFile file1 = new MockMultipartFile("files", "kuromi.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MultipartFile file2 = new MockMultipartFile("files", "clip.mp4", "video/mp4", new byte[]{4, 5});
        when(multipartUploader.upload(any(MultipartFile.class), anyString()))
                .thenReturn("https://cdn.example.com/files/uuid-1.jpg")
                .thenReturn("https://cdn.example.com/files/uuid-2.mp4");

        // when
        List<FileUploadInfo> results = fileService.uploadFiles(List.of(file1, file2));

        // then
        assertThat(results).hasSize(2);
        assertThat(results.get(0).url()).isEqualTo("https://cdn.example.com/files/uuid-1.jpg");
        assertThat(results.get(0).originalName()).isEqualTo("kuromi.jpg");
        assertThat(results.get(0).contentType()).isEqualTo("image/jpeg");
        assertThat(results.get(0).size()).isEqualTo(3);

        assertThat(results.get(1).url()).isEqualTo("https://cdn.example.com/files/uuid-2.mp4");
        assertThat(results.get(1).originalName()).isEqualTo("clip.mp4");
        assertThat(results.get(1).contentType()).isEqualTo("video/mp4");
        assertThat(results.get(1).size()).isEqualTo(2);

        verify(multipartUploader).upload(file1, "gachigacha/chat");
        verify(multipartUploader).upload(file2, "gachigacha/chat");
    }

    @Test
    @DisplayName("빈 목록이 오면 업로드를 시도하지 않고 빈 결과를 반환한다.")
    void uploadFiles_empty() {
        // given
        FileService fileService = fileService();

        // when
        List<FileUploadInfo> results = fileService.uploadFiles(List.of());

        // then
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("파일이 10개를 초과하면 업로드를 시도하지 않고 예외를 던진다.")
    void uploadFiles_exceedsMaxCount_throws() {
        // given
        FileService fileService = fileService();
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            files.add(new MockMultipartFile("files", "file" + i + ".jpg", "image/jpeg", new byte[]{1}));
        }

        // when & then
        assertThatThrownBy(() -> fileService.uploadFiles(files))
                .isInstanceOf(FileInvalidValueException.class);
        verify(multipartUploader, never()).upload(any(), anyString());
    }

    @Test
    @DisplayName("파일이 정확히 10개면 예외 없이 전부 업로드한다.")
    void uploadFiles_exactlyMaxCount_success() {
        // given
        FileService fileService = fileService();
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            files.add(new MockMultipartFile("files", "file" + i + ".jpg", "image/jpeg", new byte[]{1}));
        }
        when(multipartUploader.upload(any(MultipartFile.class), anyString()))
                .thenReturn("https://cdn.example.com/files/uuid.jpg");

        // when
        List<FileUploadInfo> results = fileService.uploadFiles(files);

        // then
        assertThat(results).hasSize(10);
    }
}
