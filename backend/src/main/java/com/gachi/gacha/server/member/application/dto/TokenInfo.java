package com.gachi.gacha.server.member.application.dto;

public record TokenInfo(
        String accessToken,
        String refreshToken
) {
}
