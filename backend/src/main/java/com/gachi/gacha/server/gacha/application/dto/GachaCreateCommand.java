package com.gachi.gacha.server.gacha.application.dto;

import com.gachi.gacha.server.gacha.domain.Gacha;
import lombok.Builder;

@Builder
public record GachaCreateCommand(
        String name,
        String caption,
        String thumbnailUrl
) {
    public Gacha toEntity() {
        return Gacha.builder()
                .name(this.name())
                .caption(this.caption())
                .thumbnailUrl(this.thumbnailUrl())
                .build();
    }
}
