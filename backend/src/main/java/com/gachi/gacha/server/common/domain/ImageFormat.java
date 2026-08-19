package com.gachi.gacha.server.common.domain;

import java.util.Arrays;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageFormat {
    PNG("image/png", "png"),
    JPG("image/jpeg", "jpg"),
    JPEG("image/jpeg", "jpeg"),
    GIF("image/gif", "gif"),
    WEBP("image/webp", "webp");

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

    public static ImageFormat fromContentType(final String contentType) {
        return Arrays.stream(values())
                .filter(type -> type.contentType.equalsIgnoreCase(contentType))
                .findFirst()
                .orElseThrow();
    }
}
