package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreDeleteResult;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreGachaInfo;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.application.dto.StoreUpdateResult;
import com.gachi.gacha.server.store.presentation.dto.GachaSummaryResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreCreateRequest;
import com.gachi.gacha.server.store.presentation.dto.StoreCreateResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreDeleteResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreDetailResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreGachaResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreNearbyResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreUpdateRequest;
import com.gachi.gacha.server.store.presentation.dto.StoreUpdateResponse;
import com.gachi.gacha.server.usecase.StoreGachaFacade;
import com.gachi.gacha.server.usecase.application.dto.GachaSummaryInfo;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final StoreGachaFacade storeGachaFacade;

    @GetMapping("/nearby")
    public ResponseEntity<BaseResponse<StoreNearbyResponse>> readNearbyStores(
            @RequestParam(required = false) final Double latitude,
            @RequestParam(required = false) final Double longitude,
            @RequestParam(defaultValue = "3000") final Integer radius
    ) {
        StoreNearbyResult result = storeService.findNearbyStores(latitude, longitude, radius);

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

    @PostMapping
    public ResponseEntity<BaseResponse<StoreCreateResponse>> createStore(
            @Valid @RequestBody final StoreCreateRequest request
    ) {
        StoreCreateResult result = storeService.addStore(request.toCommand());
        StoreCreateResponse response = StoreCreateResponse.from(result);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.storeId())
                .toUri();

        return BaseResponse.created(location, response);
    }

    @PatchMapping("/{storeId}")
    public BaseResponse<StoreUpdateResponse> updateStore(
            @PathVariable final Long storeId,
            @Valid @RequestBody final StoreUpdateRequest request
    ) {
        StoreUpdateResult result = storeService.modifyStore(storeId, request.toCommand());

        return BaseResponse.updated(StoreUpdateResponse.from(result));
    }

    @DeleteMapping("/{storeId}")
    public BaseResponse<StoreDeleteResponse> deleteStore(
            @PathVariable final Long storeId
    ) {
        StoreDeleteResult result = storeService.removeStore(storeId);

        return BaseResponse.deleted(StoreDeleteResponse.from(result));
    }

    @PostMapping("/{storeId}/gachas/{gachaId}")
    public ResponseEntity<BaseResponse<StoreGachaResponse>> createNearbyStores(
            @PathVariable final Long storeId,
            @PathVariable final Long gachaId
    ) {
        StoreGachaInfo storeGachaInfo = storeGachaFacade.addStoreGacha(storeId, gachaId);
        StoreGachaResponse response = StoreGachaResponse.from(storeGachaInfo);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{storeId}/gachas/{gachaId}")
                .buildAndExpand(response.storeId(), response.gachaId())
                .toUri();
        return BaseResponse.created(location, response);
    }

    @GetMapping("/{storeId}/gachas")
    public BaseResponse<Page<GachaSummaryResponse>> readStoreGachas(@PathVariable final Long storeId, final Pageable pageable) {
        Page<GachaSummaryInfo> gachaSummaryInfos = storeGachaFacade.getGachas(storeId, pageable);
        return BaseResponse.ok(gachaSummaryInfos.map(GachaSummaryResponse::from));
    }

    @DeleteMapping("/{storeId}/gachas/{gachaId}")
    public BaseResponse<StoreGachaResponse> deleteStoreGachas(@PathVariable final Long storeId, @PathVariable final Long gachaId) {
        StoreGachaInfo storeGachaInfo = storeGachaFacade.removeStoreGacha(storeId, gachaId);
        return BaseResponse.deleted(StoreGachaResponse.from(storeGachaInfo));
    }
}
