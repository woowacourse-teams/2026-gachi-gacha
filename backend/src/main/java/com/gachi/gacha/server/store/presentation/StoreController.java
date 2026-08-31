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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final StoreGachaService storeGachaService;

    @GetMapping("/nearby")
    public ResponseEntity<BaseResponse<StoreNearbyResponse>> readNearbyStores(
            @RequestParam(required = false) final Double latitude,
            @RequestParam(required = false) final Double longitude,
            @RequestParam(defaultValue = "3000") final Integer radius,
            @RequestParam(required = false) final Integer floor
    ) {
        StoreNearbyResult result = storeService.findNearbyStores(latitude, longitude, radius, floor);

        return ResponseEntity.ok(BaseResponse.ok(StoreNearbyResponse.from(result)));
    }

    @GetMapping
    public BaseResponse<Page<StoreListResponse>> readStores(
            @PageableDefault(sort = "id", direction = Direction.DESC) final Pageable pageable
    ) {
        Page<StoreListResult> stores = storeService.findStores(pageable);
        return BaseResponse.ok(stores.map(StoreListResponse::from));
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<BaseResponse<StoreDetailResponse>> readStore(
            @PathVariable final Long storeId
    ) {
        StoreDetailResult result = storeService.getStore(storeId);
        return ResponseEntity.ok(BaseResponse.ok(StoreDetailResponse.from(result)));
    }

    @GetMapping("/{storeId}/gachas")
    public BaseResponse<Page<GachaSummaryResponse>> readStoreGachas(@PathVariable final Long storeId,
                                                                    final Pageable pageable) {
        Page<GachaSummaryInfo> gachaSummaryInfos = storeGachaService.findGachasByStoreId(storeId, pageable);
        return BaseResponse.ok(gachaSummaryInfos.map(GachaSummaryResponse::from));
    }
}
