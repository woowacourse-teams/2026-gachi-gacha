package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreImageService;
import com.gachi.gacha.server.store.presentation.dto.StoreImageListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreImageResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stores/{storeId}/images")
@RequiredArgsConstructor
public class StoreImageController {

    private final StoreImageService storeImageService;

    @GetMapping
    public BaseResponse<StoreImageListResponse> findImages(@PathVariable final Long storeId) {
        List<StoreImageResponse> responses = storeImageService.findImages(storeId).stream()
                .map(StoreImageResponse::from)
                .toList();

        return BaseResponse.ok(StoreImageListResponse.from(responses));
    }
}
