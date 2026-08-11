package com.gachi.gacha.server.store.infra.config;

import com.gachi.gacha.server.common.exception.S3Exception;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Component
@RequiredArgsConstructor
public class ImageUploader {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    public String upload(final MultipartFile file, final String path) {
        final String key = generateUniqueKey(path, file.getOriginalFilename());

        final PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        try {
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (final IOException e) {
            throw new S3Exception("이미지 파일을 읽는 중 오류가 발생했습니다. key=" + key, e);
        } catch (final SdkException e) {
            throw new S3Exception("이미지 업로드 중 오류가 발생했습니다. key=" + key, e);
        }

        return convertToS3Url(key);
    }

    public void delete(final String imageUrl) {
        final String key = extractKeyFromUrl(imageUrl);

        final DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try {
            s3Client.deleteObject(request);
        } catch (final SdkException e) {
            throw new S3Exception("이미지 삭제 중 오류가 발생했습니다. key=" + key, e);
        }
    }

    /**
     * 원본 파일명에 UUID를 붙여 S3 객체 키를 생성한다.
     * 파일명 충돌로 인한 덮어쓰기를 방지하기 위함.
     */
    private String generateUniqueKey(final String path, final String originalFileName) {
        return "%s/%s_%s".formatted(path, UUID.randomUUID(), originalFileName);
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
        final int index = imageUrl.indexOf(".amazonaws.com/");
        return imageUrl.substring(index + ".amazonaws.com/".length());
    }
}
