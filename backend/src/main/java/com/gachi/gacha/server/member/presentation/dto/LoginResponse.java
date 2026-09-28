package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.TokenInfo;

public record LoginResponse(
        String accessToken,
        String refreshToken
) {
    public static LoginResponse from(final TokenInfo info) {
        return new LoginResponse(info.accessToken(), info.refreshToken());
    }
}
