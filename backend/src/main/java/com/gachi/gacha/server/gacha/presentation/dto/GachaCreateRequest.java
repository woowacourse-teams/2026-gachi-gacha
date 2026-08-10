package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;

public record GachaCreateRequest(
    String name,
    String caption,
    String description,
    String thumbnailUrl
) {
    public Gacha toEntity() {
        return Gacha.builder()
                .name(this.name())
                .caption(this.caption())
                .description(this.description())
                .thumbnailUrl(this.thumbnailUrl())
                .build();
    }
}
