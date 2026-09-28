package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.member.application.TokenService;
import com.gachi.gacha.server.member.application.dto.TokenInfo;
import com.gachi.gacha.server.member.presentation.dto.LoginResponse;
import com.gachi.gacha.server.member.presentation.dto.RefreshRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TokenService tokenService;

    @PostMapping("/refresh")
    public BaseResponse<LoginResponse> refresh(@RequestBody final RefreshRequest request) {
        TokenInfo tokens = tokenService.reissue(request.refreshToken());
        return BaseResponse.ok(LoginResponse.from(tokens));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody final RefreshRequest request) {
        tokenService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
