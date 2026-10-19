package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.BlockedMemberInfo;
import java.util.List;

public record BlockedMemberListResponse(
        List<BlockedMemberResponse> blocks
) {
    public static BlockedMemberListResponse from(final List<BlockedMemberInfo> blockedMemberInfos) {
        return new BlockedMemberListResponse(
                blockedMemberInfos.stream()
                        .map(BlockedMemberResponse::from)
                        .toList()
        );
    }
}
