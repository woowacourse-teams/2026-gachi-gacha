package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.application.dto.GachaWithStoreCountInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaWithStoreCountResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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

    @Operation(summary = "가챠 목록 조회")
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

    @Operation(summary = "가챠 목록 조회")
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

    @Operation(summary = "가챠 상세 조회")
    @GetMapping("/{gachaId}")
    public BaseResponse<GachaResponse> readGacha(
            @Parameter(description = "가챠 ID", example = "1") @PathVariable final Long gachaId
    ) {
        GachaInfo gachaInfo = gachaService.findGachaById(gachaId);
        return BaseResponse.ok(GachaResponse.from(gachaInfo));
    }
}
