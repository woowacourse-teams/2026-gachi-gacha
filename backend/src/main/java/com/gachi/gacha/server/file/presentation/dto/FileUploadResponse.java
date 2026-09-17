package com.gachi.gacha.server.file.presentation.dto;

import com.gachi.gacha.server.file.application.dto.FileUploadInfo;
import lombok.Builder;

@Builder
public record FileUploadResponse(
        String url,
        String originalName,
        String contentType,
        long size
) {
    public static FileUploadResponse from(final FileUploadInfo fileUploadInfo) {
        return FileUploadResponse.builder()
                .url(fileUploadInfo.url())
                .originalName(fileUploadInfo.originalName())
                .contentType(fileUploadInfo.contentType())
                .size(fileUploadInfo.size())
                .build();
    }
}
