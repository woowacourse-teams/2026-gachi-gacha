package com.gachi.gacha.server.favorite.gacha.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.favorite.gacha.application.GachaFavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class GachaFavoriteController {

    private final GachaFavoriteService favoriteService;

    @PutMapping("/gachas/{gachaId}/favorite")
    public ResponseEntity<Void> add(@Auth final Long memberId, @PathVariable final Long gachaId) {
        favoriteService.add(memberId, gachaId);
        return BaseResponse.noContent();
    }

    @DeleteMapping("/gachas/{gachaId}/favorite")
    public ResponseEntity<Void> remove(@Auth final Long memberId, @PathVariable final Long gachaId) {
        favoriteService.remove(memberId, gachaId);
        return BaseResponse.noContent();
    }
}
