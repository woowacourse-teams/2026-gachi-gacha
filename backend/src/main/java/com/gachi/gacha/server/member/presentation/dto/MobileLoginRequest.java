package com.gachi.gacha.server.member.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;

public record MobileLoginRequest(
        @Schema(description = "모바일 SDK/브라우저에서 받은 제공자 인가 코드")
        @NotBlank String code,
        @Schema(description = "발급 nonce와 같은 OAuth callback state 값. ID token nonce와도 일치해야 함")
        @NotBlank String nonce,
        @Schema(description = "카카오·네이버 PKCE S256에 사용한 code_verifier. 애플은 생략")
        String codeVerifier,
        @Schema(description = "Apple 최초 로그인에서 받은 사용자 이름 JSON")
        String user
) {
}
