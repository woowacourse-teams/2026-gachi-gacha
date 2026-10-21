package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.BlockedMemberInfo;
import java.time.LocalDateTime;

public record BlockedMemberResponse(
        Long memberId,
        String nickname,
        LocalDateTime blockedAt
) {
    public static BlockedMemberResponse from(final BlockedMemberInfo info) {
        return new BlockedMemberResponse(info.memberId(), info.nickname(), info.blockedAt());
    }
}
