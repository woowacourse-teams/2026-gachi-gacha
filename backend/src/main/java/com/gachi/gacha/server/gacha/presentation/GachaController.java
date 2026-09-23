package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/gachas")
@RequiredArgsConstructor
public class GachaController {

    private final GachaService gachaService;

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
