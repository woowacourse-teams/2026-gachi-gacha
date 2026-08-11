package com.gachi.gacha.server.gacha.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record GachaUpdateCommand(
        @NotBlank(message = "가챠 이름은 필수입니다.")
        String name,
        String caption,
        String thumbnailUrl
) {
}
