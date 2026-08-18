package com.gachi.gacha.server.gacha.application.dto;

public record ApproveGachaCommand(
        Long gachaId,
        String name
) {
}
