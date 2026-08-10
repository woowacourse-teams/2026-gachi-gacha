package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaCreateCommand;
import jakarta.validation.constraints.NotBlank;

public record GachaCreateRequest(
    @NotBlank(message = "가챠 이름은 필수입니다.")
    String name,
    String caption,
    String thumbnailUrl
) {
    public GachaCreateCommand toCommand() {
        return GachaCreateCommand.builder()
                .name(this.name())
                .caption(this.caption())
                .thumbnailUrl(this.thumbnailUrl())
                .build();
    }
}
