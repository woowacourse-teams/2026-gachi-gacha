package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.MemberBlockResult;
import java.time.LocalDateTime;

public record MemberBlockResponse(
        Long memberId,
        boolean blocked,
        LocalDateTime blockedAt
) {
    public static MemberBlockResponse from(final MemberBlockResult result) {
        return new MemberBlockResponse(result.memberId(), true, result.blockedAt());
    }
}
