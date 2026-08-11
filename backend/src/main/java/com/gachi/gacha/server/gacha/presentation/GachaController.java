package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaCreateRequest;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
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
    public ResponseEntity<BaseResponse<GachaResponse>> createGacha(@Valid @RequestBody GachaCreateRequest request) {
        GachaInfo gachaInfo = gachaService.addGacha(request.toCommand());
        GachaResponse gachaResponse = GachaResponse.from(gachaInfo);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(gachaResponse.gachaId())
                .toUri();

        return BaseResponse.created(location, gachaResponse);
    }
}
