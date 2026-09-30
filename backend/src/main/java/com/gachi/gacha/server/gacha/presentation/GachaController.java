package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.application.dto.GachaWithStoreCountInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaWithStoreCountResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "가챠", description = "가챠 상품 조회")
@RestController
@RequestMapping("/gachas")
@RequiredArgsConstructor
public class GachaController {

    private final GachaService gachaService;

    /**
     * keyword 검색과 categoryIds 조회는 {@code params} 조건으로 갈리는 두 개의 핸들러지만,
     * OpenAPI 는 같은 path+method 를 하나의 오퍼레이션으로만 표현한다.
     * 따라서 둘이 하나로 합쳐져 문서화되며, 어느 쪽 설명이 채택될지는 보장되지 않는다.
     * 그래서 양쪽에 같은 설명을 달아 어느 쪽이 이겨도 문서가 맞도록 한다.
     */
    @Operation(
            summary = "가챠 목록 조회",
            description = """
                    가챠를 최신순으로 조회한다. 인증이 필요하지 않다.

                    두 가지 방식이 있고, `categoryIds` 를 보내는지로 갈린다.

                    | 보내는 값 | 동작 |
                    |-----------|------|
                    | `keyword` (또는 아무것도 없음) | 이름에 keyword 가 포함된 가챠. 생략하면 전체 |
                    | `categoryIds` | 해당 카테고리에 속한 가챠 (이때 keyword 는 무시된다) |

                    두 값을 함께 보내면 `categoryIds` 쪽으로 동작한다.
                    카테고리 ID 는 `GET /categories` 로 얻는다."""
    )
    @GetMapping(params = {"!categoryIds"})
    public BaseResponse<Page<GachaResponse>> readGacha(
            @Parameter(description = "가챠 이름 검색어. 생략하면 전체를 조회한다.", example = "쿠로미")
            @RequestParam(required = false) final String keyword,
            @ParameterObject
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) final Pageable pageable
    ) {
        Page<GachaInfo> gachas = gachaService.findAllGacha(keyword, pageable);
        return BaseResponse.ok(gachas.map(GachaResponse::from));
    }

    /**
     * keyword 검색과 categoryIds 조회는 {@code params} 조건으로 갈리는 두 개의 핸들러지만,
     * OpenAPI 는 같은 path+method 를 하나의 오퍼레이션으로만 표현한다.
     * 따라서 둘이 하나로 합쳐져 문서화되며, 어느 쪽 설명이 채택될지는 보장되지 않는다.
     * 그래서 양쪽에 같은 설명을 달아 어느 쪽이 이겨도 문서가 맞도록 한다.
     */
    @Operation(
            summary = "가챠 목록 조회",
            description = """
                    가챠를 최신순으로 조회한다. 인증이 필요하지 않다.

                    두 가지 방식이 있고, `categoryIds` 를 보내는지로 갈린다.

                    | 보내는 값 | 동작 |
                    |-----------|------|
                    | `keyword` (또는 아무것도 없음) | 이름에 keyword 가 포함된 가챠. 생략하면 전체 |
                    | `categoryIds` | 해당 카테고리에 속한 가챠 (이때 keyword 는 무시된다) |

                    두 값을 함께 보내면 `categoryIds` 쪽으로 동작한다.
                    카테고리 ID 는 `GET /categories` 로 얻는다."""
    )
    @GetMapping(params = {"categoryIds"})
    public BaseResponse<Page<GachaWithStoreCountResponse>> readGachaWithStoreCount(
            @Parameter(
                    description = "카테고리 ID 목록. 쉼표로 구분한다. 이 값을 보내면 카테고리 조회로 동작한다.",
                    example = "1,3",
                    required = false
            )
            @RequestParam final List<Long> categoryIds,
            @ParameterObject
            final Pageable pageable
    ) {
        Page<GachaWithStoreCountInfo> gachas = gachaService.findAllGachaByIds(categoryIds, pageable);
        return BaseResponse.ok(gachas.map(GachaWithStoreCountResponse::from));
    }

    @GetMapping("/{gachaId}")
    public BaseResponse<GachaResponse> readGacha(@PathVariable final Long gachaId) {
        GachaInfo gachaInfo = gachaService.findGachaById(gachaId);
        return BaseResponse.ok(GachaResponse.from(gachaInfo));
    }
}
