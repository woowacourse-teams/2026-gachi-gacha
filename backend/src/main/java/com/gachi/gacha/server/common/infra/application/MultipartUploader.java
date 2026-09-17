package com.gachi.gacha.server.common.infra.application;

import com.gachi.gacha.server.common.domain.MultipartFormat;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.exception.ImageInvalidValueException;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;

/**
 * 이미지·동영상(MultipartFormat 화이트리스트에 등록된 포맷)을 검증한 뒤 S3Uploader에 위임한다.
 * 항상 인라인으로 열리면 되는 미디어만 다루므로 contentDisposition은 늘 null로 전달한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MultipartUploader {

    private final S3Uploader s3Uploader;
    private final RestTemplate restTemplate;

    public String upload(final MultipartFile file, final String path) {
        String contentType = validateContentType(file.getContentType());
        String extension = validateExtension(file.getOriginalFilename());

        try {
            RequestBody body = RequestBody.fromInputStream(file.getInputStream(), file.getSize());
            return s3Uploader.upload(body, path, extension, contentType, null);
        } catch (IOException e) {
            log.error("파일을 읽는 중 오류가 발생했습니다.", e);
            throw new S3Exception(ErrorCode.S3_IMAGE_READ_ERROR);
        }
    }

    /**
     * 외부 URL(인스타그램 CDN 등)에서 미디어를 내려받아 그대로 S3에 업로드한다.
     * MultipartFile이 없는 소스(서버가 직접 다운로드한 이미지)를 위한 진입점.
     */
    public String uploadFromUrl(final String sourceUrl, final String path) {
        ResponseEntity<byte[]> response = downloadImage(sourceUrl);
        String contentType = validateContentType(resolveContentType(response));
        String extension = MultipartFormat.fromContentType(contentType).getExtension();

        RequestBody body = RequestBody.fromBytes(response.getBody());
        return s3Uploader.upload(body, path, extension, contentType, null);
    }

    public void delete(final String fileUrl) {
        s3Uploader.delete(fileUrl);
    }

    /**
     * 파일을 영구 삭제하지 않고 trash 하위 경로로 이동한다(soft delete).
     */
    public void moveToTrash(final String fileUrl) {
        s3Uploader.moveToTrash(fileUrl);
    }

    /**
     * 클라이언트가 보낸 Content-Type을 그대로 신뢰하지 않고 화이트리스트로 검증한다. 검증 없이 저장하면
     * text/html 등으로 위장한 파일이 스토어드 XSS 벡터가 될 수 있다. svg 등 화이트리스트에 없는 포맷은
     * 별도 블랙리스트 없이 이 검증만으로 자동 차단된다.
     */
    private String validateContentType(final String contentType) {
        if (!MultipartFormat.isAllowedContentType(contentType)) {
            throw new ImageInvalidValueException(ErrorCode.S3_IMAGE_INVALID_POLICY);
        }
        return contentType;
    }

    /**
     * 외부 URL에서 미디어를 내려받는다. 응답 상태코드가 2xx가 아니면 RestTemplate이 자체적으로
     * 예외를 던지므로, 여기서는 빈 body만 추가로 방어한다.
     */
    private ResponseEntity<byte[]> downloadImage(final String sourceUrl) {
        try {
            ResponseEntity<byte[]> response = restTemplate.getForEntity(sourceUrl, byte[].class);
            if (response.getBody() == null || response.getBody().length == 0) {
                throw new S3Exception(ErrorCode.S3_IMAGE_DOWNLOAD_ERROR);
            }
            return response;
        } catch (RestClientException e) {
            log.error("원본 파일을 다운로드하는 중 오류가 발생했습니다. sourceUrl={}", sourceUrl, e);
            throw new S3Exception(ErrorCode.S3_IMAGE_DOWNLOAD_ERROR);
        }
    }

    /**
     * 응답의 Content-Type 헤더에서 charset 등 부가 파라미터를 제외한 순수 타입만 뽑는다.
     */
    private String resolveContentType(final ResponseEntity<byte[]> response) {
        MediaType mediaType = response.getHeaders().getContentType();
        if (mediaType == null) {
            return null;
        }
        return "%s/%s".formatted(mediaType.getType(), mediaType.getSubtype());
    }

    /**
     * 원본 파일명에서 확장자만 뽑아 화이트리스트로 검증한다. 원본 파일명 자체는 키에 사용하지 않는다.
     */
    private String validateExtension(final String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new ImageInvalidValueException(ErrorCode.S3_IMAGE_INVALID_POLICY);
        }

        String extension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1).toLowerCase();
        if (!MultipartFormat.isAllowedExtension(extension)) {
            throw new ImageInvalidValueException(ErrorCode.S3_IMAGE_INVALID_POLICY);
        }
        return extension;
    }
}
