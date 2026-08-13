package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.GachaImage;
import lombok.Builder;

@Builder
public record GachaImageInfo(
        Long gachaImageId,
        String imageUrl
) {
    public static GachaImageInfo from(final GachaImage gachaImage) {
        return GachaImageInfo.builder()
                .gachaImageId(gachaImage.getId())
                .imageUrl(gachaImage.getImageUrl())
                .build();
    }
}
