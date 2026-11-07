package com.gachi.gacha.server.favorite.store.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.favorite.store.application.StoreFavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class StoreFavoriteController {

    private final StoreFavoriteService favoriteService;

    @PutMapping("/stores/{storeId}/favorite")
    public ResponseEntity<Void> add(@Auth final Long memberId, @PathVariable final Long storeId) {
        favoriteService.add(memberId, storeId);
        return BaseResponse.noContent();
    }

    @DeleteMapping("/stores/{storeId}/favorite")
    public ResponseEntity<Void> remove(@Auth final Long memberId, @PathVariable final Long storeId) {
        favoriteService.remove(memberId, storeId);
        return BaseResponse.noContent();
    }
}
