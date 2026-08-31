package com.gachi.gacha.server.collection.infra.platform.dto;

import com.gachi.gacha.server.collection.infra.platform.PlatformType;

public record PlatformPostDto(
        String originalId,
        String content,
        String imageUrl,
        PlatformType platformType
) {
}
