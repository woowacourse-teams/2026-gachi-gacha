package com.gachi.gacha.server.common.domain;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import java.util.Arrays;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MultipartFormat {
    PNG("image/png", "png"),
    JPG("image/jpeg", "jpg"),
    JPEG("image/jpeg", "jpeg"),
    GIF("image/gif", "gif"),
    WEBP("image/webp", "webp"),
    MP4("video/mp4", "mp4"),
    MOV("video/quicktime", "mov");

    private final String contentType;
    private final String extension;

    public static boolean isAllowedContentType(final String contentType) {
        if (contentType == null) {
            return false;
        }
        return Arrays.stream(values())
                .anyMatch(type -> type.contentType.equalsIgnoreCase(contentType));
    }

    public static boolean isAllowedExtension(final String extension) {
        if (extension == null) {
            return false;
        }
        return Arrays.stream(values())
                .anyMatch(type -> type.extension.equalsIgnoreCase(extension));
    }

    public static MultipartFormat fromContentType(final String contentType) {
        return Arrays.stream(values())
                .filter(type -> type.contentType.equalsIgnoreCase(contentType))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.S3_IMAGE_INVALID_POLICY));
    }
}
