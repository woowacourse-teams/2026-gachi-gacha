package com.gachi.gacha.server.notification.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.notification.application.PushTokenService;
import com.gachi.gacha.server.notification.presentation.dto.PushTokenDeleteRequest;
import com.gachi.gacha.server.notification.presentation.dto.PushTokenRegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "푸시 토큰", description = "기기의 FCM 등록 토큰 등록·삭제")
@SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
@RestController
@RequestMapping("/push-tokens")
@RequiredArgsConstructor
public class PushTokenController {

    private final PushTokenService pushTokenService;

    @Operation(
            summary = "푸시 토큰 등록",
            description = "로그인 직후, 앱 실행 시, 토큰이 바뀔 때 호출한다. 다른 계정에 등록된 토큰이면 지금 회원으로 옮긴다."
    )
    @PutMapping
    public BaseResponse<Void> registerPushToken(
            @Auth final Long memberId,
            @Valid @RequestBody final PushTokenRegisterRequest request
    ) {
        pushTokenService.register(memberId, request.toCommand());
        return BaseResponse.updated(null);
    }

    @Operation(
            summary = "푸시 토큰 삭제",
            description = "로그아웃할 때 액세스 토큰을 지우기 전에 호출한다. 내 토큰이 아니거나 없어도 성공으로 처리한다."
    )
    @DeleteMapping
    public BaseResponse<Void> unregisterPushToken(
            @Auth final Long memberId,
            @Valid @RequestBody final PushTokenDeleteRequest request
    ) {
        pushTokenService.unregister(memberId, request.token());
        return BaseResponse.deleted(null);
    }
}
