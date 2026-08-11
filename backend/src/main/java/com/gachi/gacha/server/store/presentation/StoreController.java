package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.application.dto.StoreCreateResult;
import com.gachi.gacha.server.store.application.dto.StoreDetailResult;
import com.gachi.gacha.server.store.application.dto.StoreListResult;
import com.gachi.gacha.server.store.presentation.dto.StoreCreateRequest;
import com.gachi.gacha.server.store.presentation.dto.StoreDetailResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping
    public ResponseEntity<BaseResponse<StoreListResponse>> readStores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        StoreListResult result = storeService.findAllStore(page, size);
        return ResponseEntity.ok(BaseResponse.ok(StoreListResponse.from(result)));
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<BaseResponse<StoreDetailResponse>> readStore(
            @PathVariable Long storeId
    ) {
        StoreDetailResult result = storeService.getStore(storeId);
        return ResponseEntity.ok(BaseResponse.ok(StoreDetailResponse.from(result)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<StoreResponse>> createStore(
            @Valid @RequestBody StoreCreateRequest request
    ) {
        StoreCreateResult storeCreateResult = storeService.addStore(request.toCommand());
        StoreResponse storeResponse = StoreResponse.from(storeCreateResult);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(storeResponse.storeId())
                .toUri();

        return BaseResponse.created(location, storeResponse);
    }
}
