package com.gachi.gacha.server.trade.application.dto;

import com.gachi.gacha.server.gacha.domain.Category;
import lombok.Builder;

@Builder
public record CategoryInfo(
        Long categoryId,
        String name
) {
    public static CategoryInfo from(final Category category) {
        return CategoryInfo.builder()
                .categoryId(category.getId())
                .name(category.getName())
                .build();
    }
}
