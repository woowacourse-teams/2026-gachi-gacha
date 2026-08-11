package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaUpdateCommand;
import jakarta.validation.constraints.NotBlank;

public record GachaUpdateRequest(
        @NotBlank(message = "가챠 이름은 필수입니다.")
        String name,
        String caption,
        String thumbnailUrl
) {
    public GachaUpdateCommand toCommand() {
        return GachaUpdateCommand.builder()
                .name(name)
                .caption(caption)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
