package com.gachi.gacha.server.common.infra.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.exception.FileInvalidValueException;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;

/**
 * 이미지 전용 화이트리스트가 아니라, 채팅 첨부처럼 다양한 종류의 파일을 폭넓게 허용하되 SVG만 명시적으로 차단하는 정책으로 업로드한다. SVG는 image/* MIME으로 분류되지만 내부에 <script>를
 * 담을 수 있어 인라인으로 열리면 XSS 벡터가 될 수 있기 때문이다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FileUploader {

    private static final String SVG_CONTENT_TYPE = "image/svg+xml";
    private static final String IMAGE_CONTENT_TYPE_PREFIX = "image/";
    private static final String SVG_EXTENSION = "svg";

    private final S3Uploader s3Uploader;

    public String upload(final MultipartFile file, final String path) {
        String contentType = file.getContentType();
        String originalFileName = file.getOriginalFilename();
        String extension = extractExtension(originalFileName);
        validateNotSvg(contentType, extension);

        try {
            RequestBody body = RequestBody.fromInputStream(file.getInputStream(), file.getSize());
            String contentDisposition = resolveContentDisposition(contentType, originalFileName);
            return s3Uploader.upload(body, path, extension, contentType, contentDisposition);
        } catch (IOException e) {
            log.error("파일을 읽는 중 오류가 발생했습니다.", e);
            throw new S3Exception(ErrorCode.S3_READ_ERROR);
        }
    }

    /**
     * 확장자·Content-Type 둘 중 하나만 검사하면 클라이언트가 다른 한쪽을 조작해 우회할 수 있으므로 둘 다 확인한다.
     */
    private void validateNotSvg(final String contentType, final String extension) {
        if (SVG_CONTENT_TYPE.equalsIgnoreCase(contentType) || SVG_EXTENSION.equalsIgnoreCase(extension)) {
            throw new FileInvalidValueException(ErrorCode.S3_FILE_INVALID_POLICY);
        }
    }

    /**
     * image/*(svg 제외)는 인라인으로 바로 보여도 안전하니 헤더를 붙이지 않고, 그 외 파일은 브라우저가 직접 실행하지 못하도록
     * 다운로드로만 열리게 한다. 이때 원본 파일명을 넣어주지 않으면 브라우저가 S3 키(UUID)를 저장 파일명으로 제안하게 되므로,
     * RFC 5987 형식(filename*=UTF-8''...)으로 원본 파일명을 percent-encoding해서 함께 실어 보낸다.
     */
    private String resolveContentDisposition(final String contentType, final String originalFileName) {
        if (contentType != null && contentType.toLowerCase().startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
            return null;
        }
        return "attachment; filename*=UTF-8''" + encodeFileName(originalFileName);
    }

    private String encodeFileName(final String originalFileName) {
        return URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String extractExtension(final String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new FileInvalidValueException(ErrorCode.S3_FILE_INVALID_POLICY);
        }
        return originalFileName.substring(originalFileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
