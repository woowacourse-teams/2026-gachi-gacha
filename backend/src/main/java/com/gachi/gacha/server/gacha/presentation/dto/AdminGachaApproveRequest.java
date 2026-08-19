package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.GachaApproveCommand;

public record AdminGachaApproveRequest(
        String name
) {
    public GachaApproveCommand toCommand(final Long gachaId) {
        return new GachaApproveCommand(gachaId, name);
    }
}
