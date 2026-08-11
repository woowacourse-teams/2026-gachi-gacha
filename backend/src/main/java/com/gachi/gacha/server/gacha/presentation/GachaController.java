package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.GachaDeleteResult;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.application.dto.GachaResult;
import com.gachi.gacha.server.gacha.presentation.dto.GachaCreateRequest;
import com.gachi.gacha.server.gacha.presentation.dto.GachaDeleteResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaUpdateRequest;
import com.gachi.gacha.server.gacha.presentation.dto.GachaUpdateResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/gachas")
@RequiredArgsConstructor
public class GachaController {

    private final GachaService gachaService;

    @PostMapping
    public ResponseEntity<BaseResponse<GachaResponse>> createGacha(@Valid @RequestBody final GachaCreateRequest request) {
        GachaInfo gachaInfo = gachaService.addGacha(request.toCommand());
        GachaResponse gachaResponse = GachaResponse.from(gachaInfo);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(gachaResponse.gachaId())
                .toUri();

        return BaseResponse.created(location, gachaResponse);
    }

    @PutMapping("/{gachaId}")
    public BaseResponse<GachaUpdateResponse> updateGacha(@PathVariable final Long gachaId, @Valid @RequestBody final GachaUpdateRequest request) {
        GachaResult result = gachaService.modify(gachaId, request.toCommand());
        return BaseResponse.updated(GachaUpdateResponse.from(result));
    }

    @DeleteMapping("/{gachaId}")
    public BaseResponse<GachaDeleteResponse> deleteGacha(@PathVariable final Long gachaId) {
        GachaDeleteResult result = gachaService.remove(gachaId);
        return BaseResponse.deleted(GachaDeleteResponse.from(result));
    }

    @GetMapping
    public BaseResponse<Page<GachaResponse>> readGacha(
            @Nullable final String keyword,
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) final Pageable pageable) {
        Page<GachaInfo> gachas = gachaService.findAllGacha(keyword, pageable);
        return BaseResponse.ok(gachas.map(GachaResponse::from));
    }

    @GetMapping("/{gachaId}")
    public BaseResponse<GachaResponse> readGacha(@PathVariable final Long gachaId) {
        GachaInfo gachaInfo = gachaService.findGachaById(gachaId);
        return BaseResponse.ok(GachaResponse.from(gachaInfo));
    }
}
