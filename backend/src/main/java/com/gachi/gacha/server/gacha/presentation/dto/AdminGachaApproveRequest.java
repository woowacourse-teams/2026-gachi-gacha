package com.gachi.gacha.server.gacha.presentation.dto;

import com.gachi.gacha.server.gacha.application.dto.ApproveGachaCommand;

public record AdminGachaApproveRequest(
        String name
) {
    public ApproveGachaCommand toCommand(final Long gachaId) {
        return new ApproveGachaCommand(gachaId, name);
    }
}
