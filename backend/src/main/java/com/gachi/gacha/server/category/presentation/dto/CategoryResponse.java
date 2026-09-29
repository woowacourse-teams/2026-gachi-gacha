package com.gachi.gacha.server.category.presentation.dto;

import com.gachi.gacha.server.category.application.dto.CategoryInfo;
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
