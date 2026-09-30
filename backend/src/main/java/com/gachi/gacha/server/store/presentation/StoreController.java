package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.presentation.dto.GachaSummaryResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreDetailResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreNearbyResponse;
import com.gachi.gacha.server.usecase.application.StoreGachaService;
import com.gachi.gacha.server.usecase.application.dto.GachaSummaryInfo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "매장", description = "가챠 매장 조회 및 주변 검색")
@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final StoreGachaService storeGachaService;

    @Operation(
            summary = "주변 매장 조회",
            description = "기준 좌표에서 radius 미터 안에 있는 매장을 가까운 순으로 반환한다."
    )
    @GetMapping("/nearby")
    public BaseResponse<StoreNearbyResponse> readNearbyStores(
            @Parameter(description = "기준 위도", example = "37.5563") @RequestParam(required = false) final Double latitude,
            @Parameter(description = "기준 경도", example = "126.9236") @RequestParam(required = false) final Double longitude,
            @Parameter(description = "검색 반경(미터)", example = "3000") @RequestParam(defaultValue = "3000") final Integer radius,
            @Parameter(description = "층수로 추가 필터링. 생략하면 전체 층을 조회한다.", example = "1")
            @RequestParam(required = false) final Integer floor
    ) {
        StoreNearbyResult result = storeService.findNearbyStores(latitude, longitude, radius, floor);
        return BaseResponse.ok(StoreNearbyResponse.from(result));
    }

    @Operation(
            summary = "특정 가챠를 보유한 주변 매장 조회",
            description = "기준 좌표 주변 매장 중 해당 가챠를 보유한 곳만 가까운 순으로 반환한다."
    )
    @GetMapping("/nearby/{gachaId}")
    public BaseResponse<StoreNearbyResponse> readNearbyStores(
            @Parameter(description = "기준 위도", example = "37.5563") @RequestParam(required = false) final Double latitude,
            @Parameter(description = "기준 경도", example = "126.9236") @RequestParam(required = false) final Double longitude,
            @Parameter(description = "검색 반경(미터)", example = "3000") @RequestParam(defaultValue = "3000") final Integer radius,
            @Parameter(description = "층수로 추가 필터링", example = "1") @RequestParam(required = false) final Integer floor,
            @Parameter(description = "가챠 ID", example = "1") @PathVariable final Long gachaId
    ) {
        StoreNearbyResult result = storeService.findNearbyStoresByGachaId(latitude, longitude, radius, floor, gachaId);
        return BaseResponse.ok(StoreNearbyResponse.from(result));
    }

    @Operation(summary = "매장 목록 조회", description = "전체 매장을 최근 등록순으로 조회한다.")
    @GetMapping
    public BaseResponse<Page<StoreListResponse>> readStores(
            @ParameterObject
            @PageableDefault(sort = "id", direction = Direction.DESC) final Pageable pageable
    ) {
        Page<StoreListResult> stores = storeService.findStores(pageable);
        return BaseResponse.ok(stores.map(StoreListResponse::from));
    }

    @Operation(summary = "매장 상세 조회")
    @GetMapping("/{storeId}")
    public BaseResponse<StoreDetailResponse> readStore(
            @Parameter(description = "매장 ID", example = "1") @PathVariable final Long storeId
    ) {
        StoreDetailResult result = storeService.getStore(storeId);
        return BaseResponse.ok(StoreDetailResponse.from(result));
    }

    @Operation(summary = "매장 보유 가챠 목록 조회", description = "해당 매장이 보유한 가챠를 반환한다.")
    @GetMapping("/{storeId}/gachas")
    public BaseResponse<Page<GachaSummaryResponse>> readStoreGachas(
            @Parameter(description = "매장 ID", example = "1") @PathVariable final Long storeId,
            @ParameterObject
            final Pageable pageable
    ) {
        Page<GachaSummaryInfo> gachaSummaryInfos = storeGachaService.findGachasByStoreId(storeId, pageable);
        return BaseResponse.ok(gachaSummaryInfos.map(GachaSummaryResponse::from));
    }
}
