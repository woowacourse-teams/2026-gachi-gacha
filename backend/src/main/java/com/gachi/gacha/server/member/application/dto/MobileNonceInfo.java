package com.gachi.gacha.server.member.application.dto;

public record MobileNonceInfo(String nonce, long expiresInSeconds) {
}
