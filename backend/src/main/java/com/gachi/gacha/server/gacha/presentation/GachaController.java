package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.presentation.dto.GachaCreateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/gachas")
@RequiredArgsConstructor
public class GachaController {

    private final GachaService gachaService;

    @PostMapping
    public ResponseEntity<Long> createGacha(@RequestBody GachaCreateRequest request) {
        return ResponseEntity.ok(gachaService.createGacha(request));
    }
}
