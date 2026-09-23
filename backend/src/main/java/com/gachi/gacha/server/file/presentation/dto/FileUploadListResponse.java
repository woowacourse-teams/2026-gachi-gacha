package com.gachi.gacha.server.file.presentation.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record FileUploadListResponse(
        List<FileUploadResponse> files
) {
    public static FileUploadListResponse from(final List<FileUploadResponse> files) {
        return FileUploadListResponse.builder()
                .files(files)
                .build();
    }
}
