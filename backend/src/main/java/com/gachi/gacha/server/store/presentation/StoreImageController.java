package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.common.domain.BaseCode;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.store.application.StoreImageService;
import com.gachi.gacha.server.store.application.dto.StoreImageInfo;
import com.gachi.gacha.server.store.presentation.dto.StoreImageDeleteResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreImageListResponse;
import com.gachi.gacha.server.store.presentation.dto.StoreImageResponse;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/stores/{storeId}/images")
@RequiredArgsConstructor
public class StoreImageController {

    private final StoreImageService storeImageService;

    @GetMapping
    public ResponseEntity<BaseResponse<StoreImageListResponse>> findImages(@PathVariable final Long storeId) {
        final List<StoreImageResponse> responses = storeImageService.findImages(storeId).stream()
                .map(StoreImageResponse::from)
                .toList();

        return ResponseEntity.ok(BaseResponse.ok(StoreImageListResponse.from(responses)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<StoreImageResponse>> addImage(
            @PathVariable final Long storeId,
            @RequestParam("image") final MultipartFile image
    ) {
        final StoreImageInfo storeImageInfo = storeImageService.addImage(storeId, image);
        final StoreImageResponse response = StoreImageResponse.from(storeImageInfo);

        final URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{storeImageId}")
                .buildAndExpand(response.storeImageId())
                .toUri();

        return BaseResponse.created(location, response);
    }

    @PatchMapping(path = "/{storeImageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<StoreImageResponse>> modifyImage(
            @PathVariable final Long storeId,
            @PathVariable final Long storeImageId,
            @RequestParam("image") final MultipartFile image
    ) {
        final StoreImageInfo storeImageInfo = storeImageService.modifyImage(storeId, storeImageId, image);
        final StoreImageResponse response = StoreImageResponse.from(storeImageInfo);

        return ResponseEntity.status(BaseCode.UPDATED.getStatus())
                .body(BaseResponse.of(BaseCode.UPDATED, response));
    }

    @DeleteMapping("/{storeImageId}")
    public ResponseEntity<BaseResponse<StoreImageDeleteResponse>> removeImage(
            @PathVariable final Long storeId,
            @PathVariable final Long storeImageId
    ) {
        final Long deletedId = storeImageService.removeImage(storeId, storeImageId);

        return ResponseEntity.status(BaseCode.DELETED.getStatus())
                .body(BaseResponse.of(BaseCode.DELETED, StoreImageDeleteResponse.from(deletedId)));
    }
}
