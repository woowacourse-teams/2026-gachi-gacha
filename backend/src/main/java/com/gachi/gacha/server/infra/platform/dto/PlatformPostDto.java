package com.gachi.gacha.server.infra.platform.dto;

import com.gachi.gacha.server.infra.platform.PlatformType;

public record PlatformPostDto(
        String originalId,
        String content,
        String imageUrl,
        PlatformType platformType
) {
}
