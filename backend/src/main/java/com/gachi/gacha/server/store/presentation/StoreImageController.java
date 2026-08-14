package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.BaseCode;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreImageService;
import com.gachi.gacha.server.store.application.dto.StoreImageInfo;
import com.gachi.gacha.server.store.presentation.dto.StoreImageDeleteResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreImageListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreImageResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<StoreImageListResponse>> addImage(
            @PathVariable final Long storeId,
            @RequestParam("images") final List<MultipartFile> images
    ) {
        List<StoreImageResponse> responses = storeImageService.addImage(storeId, images).stream()
                .map(StoreImageResponse::from)
                .toList();

        return ResponseEntity.status(BaseCode.CREATED.getStatus())
                .body(BaseResponse.of(BaseCode.CREATED, StoreImageListResponse.from(responses)));
    }

    @PutMapping(path = "/{storeImageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<StoreImageResponse> modifyImage(
            @PathVariable final Long storeId,
            @PathVariable final Long storeImageId,
            @RequestParam("image") final MultipartFile image
    ) {
        StoreImageInfo storeImageInfo = storeImageService.modifyImage(storeId, storeImageId, image);
        StoreImageResponse response = StoreImageResponse.from(storeImageInfo);

        return BaseResponse.updated(response);
    }

    @DeleteMapping("/{storeImageId}")
    public BaseResponse<StoreImageDeleteResponse> removeImage(
            @PathVariable final Long storeId,
            @PathVariable final Long storeImageId
    ) {
        Long deletedId = storeImageService.removeImage(storeId, storeImageId);

        return BaseResponse.deleted(StoreImageDeleteResponse.from(deletedId));
    }
}
