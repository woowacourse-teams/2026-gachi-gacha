package com.gachi.gacha.server.trade.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.trade.application.CategoryService;
import com.gachi.gacha.server.trade.presentation.dto.CategoryListResponse;
import com.gachi.gacha.server.trade.presentation.dto.CategoryResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public BaseResponse<CategoryListResponse> searchCategories(@Nullable final String keyword) {
        List<CategoryResponse> responses = categoryService.searchCategories(keyword).stream()
                .map(CategoryResponse::from)
                .toList();

        return BaseResponse.ok(CategoryListResponse.from(responses));
    }
}
