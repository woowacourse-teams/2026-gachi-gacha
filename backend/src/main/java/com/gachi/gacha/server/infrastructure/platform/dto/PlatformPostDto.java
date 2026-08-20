package com.gachi.gacha.server.infrastructure.platform.dto;

import com.gachi.gacha.server.infrastructure.platform.PlatformType;

public record PlatformPostDto(
        String originalId,
        String content,
        String imageUrl,
        PlatformType platformType
) {
}
