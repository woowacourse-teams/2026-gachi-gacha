package com.gachi.gacha.server.member.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record MobileNonceResponse(
        @Schema(description = "OIDC nonce와 OAuth state에 모두 사용할 서버 발급 값") String nonce,
        @Schema(description = "nonce/state 만료까지 남은 시간(초)") long expiresInSeconds
) {
}
