package com.gachi.gacha.server.gacha.application.dto;

public record GachaApproveCommand(
        Long gachaId,
        String name
) {
}
