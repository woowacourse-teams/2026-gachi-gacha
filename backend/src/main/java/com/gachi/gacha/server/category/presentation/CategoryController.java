package com.gachi.gacha.server.category.presentation;

import com.gachi.gacha.server.category.application.CategoryService;
import com.gachi.gacha.server.category.presentation.dto.CategoryListResponse;
import com.gachi.gacha.server.category.presentation.dto.CategoryResponse;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "카테고리", description = "가챠·교환 게시글에 붙는 카테고리 조회")
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(
            summary = "카테고리 목록 조회",
            description = """
                    등록된 카테고리를 조회한다. keyword 를 주면 이름에 해당 문자열이 포함된 것만 걸러낸다.

                    교환 게시글 작성 화면에서 카테고리를 고를 때 쓴다.
                    특정 카테고리에 속한 가챠 목록을 보려면 `GET /gachas?categoryIds=` 를 사용한다."""
    )
    @GetMapping
    public BaseResponse<CategoryListResponse> searchCategories(
            @Parameter(description = "카테고리 이름 검색어. 생략하면 전체를 조회한다.", example = "산리오")
            @Nullable final String keyword
    ) {
        List<CategoryResponse> responses = categoryService.searchCategories(keyword).stream()
                .map(CategoryResponse::from)
                .toList();

        return BaseResponse.ok(CategoryListResponse.from(responses));
    }
}
