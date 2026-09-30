package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreImageService;
import com.gachi.gacha.server.store.presentation.dto.StoreImageListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreImageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "매장 사진", description = "매장에 등록된 사진 조회")
@RestController
@RequestMapping("/stores/{storeId}/images")
@RequiredArgsConstructor
public class StoreImageController {

    private final StoreImageService storeImageService;

    @Operation(summary = "매장 사진 목록 조회")
    @GetMapping
    public BaseResponse<StoreImageListResponse> findImages(
            @Parameter(description = "매장 ID", example = "1") @PathVariable final Long storeId
    ) {
        List<StoreImageResponse> responses = storeImageService.findImages(storeId).stream()
                .map(StoreImageResponse::from)
                .toList();

        return BaseResponse.ok(StoreImageListResponse.from(responses));
    }
}
