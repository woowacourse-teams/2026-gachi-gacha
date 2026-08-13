package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.BaseCode;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaImageService;
import com.gachi.gacha.server.gacha.application.dto.GachaImageInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaImageDeleteResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaImageListResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaImageResponse;
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
@RequestMapping("/gachas/{gachaId}/images")
@RequiredArgsConstructor
public class GachaImageController {

    private final GachaImageService gachaImageService;

    @GetMapping
    public BaseResponse<GachaImageListResponse> findImages(@PathVariable final Long gachaId) {
        List<GachaImageResponse> responses = gachaImageService.findImages(gachaId).stream()
                .map(GachaImageResponse::from)
                .toList();

        return BaseResponse.ok(GachaImageListResponse.from(responses));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<GachaImageListResponse>> addImage(
            @PathVariable final Long gachaId,
            @RequestParam("images") final List<MultipartFile> images
    ) {
        List<GachaImageResponse> responses = gachaImageService.addImage(gachaId, images).stream()
                .map(GachaImageResponse::from)
                .toList();

        return ResponseEntity.status(BaseCode.CREATED.getStatus())
                .body(BaseResponse.of(BaseCode.CREATED, GachaImageListResponse.from(responses)));
    }

    @PutMapping(path = "/{gachaImageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<GachaImageResponse> modifyImage(
            @PathVariable final Long gachaId,
            @PathVariable final Long gachaImageId,
            @RequestParam("image") final MultipartFile image
    ) {
        GachaImageInfo gachaImageInfo = gachaImageService.modifyImage(gachaId, gachaImageId, image);
        GachaImageResponse response = GachaImageResponse.from(gachaImageInfo);

        return BaseResponse.updated(response);
    }

    @DeleteMapping("/{gachaImageId}")
    public BaseResponse<GachaImageDeleteResponse> removeImage(
            @PathVariable final Long gachaId,
            @PathVariable final Long gachaImageId
    ) {
        Long deletedId = gachaImageService.removeImage(gachaId, gachaImageId);

        return BaseResponse.deleted(GachaImageDeleteResponse.from(deletedId));
    }
}
