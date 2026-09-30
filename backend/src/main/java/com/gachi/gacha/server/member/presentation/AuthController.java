package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.member.application.TokenService;
import com.gachi.gacha.server.member.application.dto.TokenInfo;
import com.gachi.gacha.server.member.presentation.dto.LoginResponse;
import com.gachi.gacha.server.member.presentation.dto.RefreshRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "인증", description = "토큰 재발급과 로그아웃")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TokenService tokenService;

    @Operation(
            summary = "액세스 토큰 재발급",
            description = """
                    refreshToken 으로 accessToken 을 새로 발급받는다. refreshToken 도 함께 교체되어 내려온다(회전).

                    이미 사용한 refreshToken 을 다시 보내면 `AUE07` 로 거부되고 해당 계정의 토큰이 무효화된다."""
    )
    @PostMapping("/refresh")
    public BaseResponse<LoginResponse> refresh(@RequestBody final RefreshRequest request) {
        TokenInfo tokens = tokenService.reissue(request.refreshToken());
        return BaseResponse.ok(LoginResponse.from(tokens));
    }

    @Operation(
            summary = "로그아웃",
            description = "서버에 저장된 refreshToken 을 폐기한다. accessToken 은 만료까지 유효하므로 클라이언트에서 함께 폐기한다."
    )
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody final RefreshRequest request) {
        tokenService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
