package com.gachi.gacha.server.common.infra.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.domain.DomainType;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Component
@RequiredArgsConstructor
public class S3Uploader {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.s3.folder}")
    private String rootFolder;

    /**
     * 객체를 어느 폴더에 둘지는 {@link DomainType}만 받아서 이 클래스가 정한다. 버킷·루트 폴더 같은 S3 설정을
     * 호출하는 쪽으로 새어 나가지 않게 하려는 것이다.
     */
    public String upload(
            final RequestBody body,
            final DomainType domainType,
            final String extension,
            final String contentType,
            final String contentDisposition
    ) {
        String key = generateUniqueKey(domainType.buildPath(rootFolder), extension);

        PutObjectRequest.Builder requestBuilder = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType);
        requestBuilder.contentDisposition(contentDisposition);

        try {
            s3Client.putObject(requestBuilder.build(), body);
        } catch (SdkException e) {
            log.error("파일 업로드 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_UPLOAD_ERROR);
        }

        return convertToS3Url(key);
    }

    public void delete(final String fileUrl) {
        String key = extractKeyFromUrl(fileUrl);

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try {
            s3Client.deleteObject(request);
        } catch (SdkException e) {
            log.error("파일 삭제 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_DELETE_ERROR);
        }
    }

    public void moveToTrash(final String fileUrl) {
        String key = extractKeyFromUrl(fileUrl);
        String trashKey = generateTrashKey(key);

        CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                .sourceBucket(bucket)
                .sourceKey(key)
                .destinationBucket(bucket)
                .destinationKey(trashKey)
                .build();

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try {
            s3Client.copyObject(copyRequest);
            s3Client.deleteObject(deleteRequest);
        } catch (SdkException e) {
            log.error("파일을 휴지통으로 이동하는 중 오류가 발생했습니다. key={}, trashKey={}", key, trashKey, e);
            throw new S3Exception(ErrorCode.S3_MOVE_ERROR);
        }
    }

    private String generateUniqueKey(final String path, final String extension) {
        return "%s/%s.%s".formatted(path, UUID.randomUUID(), extension);
    }

    private String generateTrashKey(final String key) {
        int rootFolderEndIndex = key.indexOf('/');
        String rootFolder = key.substring(0, rootFolderEndIndex);
        String pathAfterRootFolder = key.substring(rootFolderEndIndex + 1);

        return "%s/trash/%s".formatted(rootFolder, pathAfterRootFolder);
    }

    private String convertToS3Url(final String key) {
        return "https://%s.s3.amazonaws.com/%s".formatted(bucket, key);
    }

    private String extractKeyFromUrl(final String fileUrl) {
        int index = fileUrl.indexOf(".amazonaws.com/");
        return fileUrl.substring(index + ".amazonaws.com/".length());
    }
}
