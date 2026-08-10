package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.presentation.dto.GachaCreateRequest;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/gachas")
@RequiredArgsConstructor
public class GachaController {

    @Value("${url.gacha}")
    private String DEFAULT_URL;

    private final GachaService gachaService;

    @PostMapping
    public ResponseEntity<GachaResponse> createGacha(@RequestBody GachaCreateRequest request) {
        GachaInfo gachaInfo = gachaService.addGacha(request);
        GachaResponse gachaResponse = GachaResponse.fromInfo(gachaInfo);
        return ResponseEntity.created(URI.create(DEFAULT_URL + gachaResponse.gachaId())).body(gachaResponse);
    }
}
