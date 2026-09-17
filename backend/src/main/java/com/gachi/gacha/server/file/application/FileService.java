package com.gachi.gacha.server.file.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.application.MultipartUploader;
import com.gachi.gacha.server.common.infra.domain.DomainType;
import com.gachi.gacha.server.file.application.dto.FileUploadInfo;
import com.gachi.gacha.server.file.exception.FileInvalidValueException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FileService {

    private static final int MAX_FILE_COUNT = 10;

    private final MultipartUploader multipartUploader;

    public List<FileUploadInfo> uploadFiles(final List<MultipartFile> files) {
        validateFileCount(files);

        return files.stream()
                .map(this::uploadSingleFile)
                .toList();
    }

    private FileUploadInfo uploadSingleFile(final MultipartFile file) {
        String url = multipartUploader.upload(file, DomainType.CHAT);
        return FileUploadInfo.of(url, file);
    }

    /**
     * 파일 개수는 총 용량 제한(max-request-size)과는 별개로 제한한다. 작은 파일을 아주 많이 보내면 총 용량은 작아도 지금 순차 처리 구조상 S3 업로드가 그만큼 여러 번 반복되어 요청이 오래
     * 걸리기 때문이다.
     */
    private void validateFileCount(final List<MultipartFile> files) {
        if (files.size() > MAX_FILE_COUNT) {
            throw new FileInvalidValueException(ErrorCode.FILE_COUNT_EXCEEDED);
        }
    }
}
