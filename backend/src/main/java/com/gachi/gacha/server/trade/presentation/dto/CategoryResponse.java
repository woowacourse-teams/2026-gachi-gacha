package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.application.dto.CategoryInfo;
import lombok.Builder;

@Builder
public record CategoryResponse(
        Long categoryId,
        String name
) {
    public static CategoryResponse from(final CategoryInfo categoryInfo) {
        return CategoryResponse.builder()
                .categoryId(categoryInfo.categoryId())
                .name(categoryInfo.name())
                .build();
    }
}
