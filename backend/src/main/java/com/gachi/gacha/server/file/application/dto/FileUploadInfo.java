package com.gachi.gacha.server.file.application.dto;

import lombok.Builder;
import org.springframework.web.multipart.MultipartFile;

@Builder
public record FileUploadInfo(
        String url,
        String originalName,
        String contentType,
        long size
) {
    public static FileUploadInfo of(final String url, final MultipartFile file) {
        return FileUploadInfo.builder()
                .url(url)
                .originalName(file.getOriginalFilename())
                .contentType(file.getContentType())
                .size(file.getSize())
                .build();
    }
}
