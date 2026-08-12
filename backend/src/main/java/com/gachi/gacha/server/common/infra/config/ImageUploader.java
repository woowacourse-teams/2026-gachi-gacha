package com.gachi.gacha.server.common.infra.config;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.common.domain.ImageType;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImageUploader {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    public String upload(final MultipartFile file, final String path) {
        String contentType = validateContentType(file.getContentType());
        String extension = validateExtension(file.getOriginalFilename());
        String key = generateUniqueKey(path, extension);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        try {
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (final IOException e) {
            log.error("이미지 파일을 읽는 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_IMAGE_READ_ERROR);
        } catch (final SdkException e) {
            log.error("이미지 업로드 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_IMAGE_UPLOAD_ERROR);
        }

        return convertToS3Url(key);
    }

    public void delete(final String imageUrl) {
        String key = extractKeyFromUrl(imageUrl);

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try {
            s3Client.deleteObject(request);
        } catch (final SdkException e) {
            log.error("이미지 삭제 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_IMAGE_DELETE_ERROR);
        }
    }

    /**
     * 클라이언트가 보낸 Content-Type을 그대로 신뢰하지 않고 화이트리스트로 검증한다.
     * 검증 없이 저장하면 text/html 등으로 위장한 파일이 스토어드 XSS 벡터가 될 수 있다.
     */
    private String validateContentType(final String contentType) {
        if (!ImageType.isAllowedContentType(contentType)) {
            throw new InvalidValueException(ErrorCode.INVALID_IMAGE_POLICY);
        }
        return contentType;
    }

    /**
     * 원본 파일명에서 확장자만 뽑아 화이트리스트로 검증한다.
     * 원본 파일명 자체는 키에 사용하지 않는다(아래 generateUniqueKey 참고).
     */
    private String validateExtension(final String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new InvalidValueException(ErrorCode.INVALID_IMAGE_POLICY);
        }

        String extension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1).toLowerCase();
        if (!ImageType.isAllowedExtension(extension)) {
            throw new InvalidValueException(ErrorCode.INVALID_IMAGE_POLICY);
        }
        return extension;
    }

    /**
     * 원본 파일명은 키에 넣지 않고 UUID + 검증된 확장자로만 키를 생성한다.
     * 원본 파일명을 그대로 쓰면 특수문자/경로 문자로 키 구조를 조작당할 수 있기 때문이다.
     */
    private String generateUniqueKey(final String path, final String extension) {
        return "%s/%s.%s".formatted(path, UUID.randomUUID(), extension);
    }

    /**
     * S3 객체 키로부터 접근 가능한 URL을 조립한다.
     */
    private String convertToS3Url(final String key) {
        return "https://%s.s3.amazonaws.com/%s".formatted(bucket, key);
    }

    /**
     * S3 URL에서 객체 키만 역추출한다. (삭제 요청 시 필요)
     */
    private String extractKeyFromUrl(final String imageUrl) {
        int index = imageUrl.indexOf(".amazonaws.com/");
        return imageUrl.substring(index + ".amazonaws.com/".length());
    }
}
