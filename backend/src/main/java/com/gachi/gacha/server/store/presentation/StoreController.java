package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreDeleteResult;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.application.dto.StoreNearbyResult;
import com.gachi.gacha.server.store.application.dto.StoreUpdateResult;
import com.gachi.gacha.server.store.presentation.dto.StoreCreateRequest;
import com.gachi.gacha.server.store.presentation.dto.StoreCreateResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreDeleteResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreDetailResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreNearbyResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreUpdateRequest;
import com.gachi.gacha.server.store.presentation.dto.StoreUpdateResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<BaseResponse<StoreListResponse>> readStores(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "20") final int size
    ) {
        StoreListResult result = storeService.findStores(page, size);
        return ResponseEntity.ok(BaseResponse.ok(StoreListResponse.from(result)));
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
}
