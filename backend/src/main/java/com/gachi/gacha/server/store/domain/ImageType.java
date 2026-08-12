package com.gachi.gacha.server.store.domain;

import java.util.Arrays;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageType {
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
}
