package com.gachi.gacha.server.trade.presentation.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record CategoryListResponse(
        List<CategoryResponse> items
) {
    public static CategoryListResponse from(final List<CategoryResponse> items) {
        return CategoryListResponse.builder()
                .items(items)
                .build();
    }
}
