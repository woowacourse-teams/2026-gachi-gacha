package com.gachi.gacha.server.member.application.dto;

import com.gachi.gacha.server.member.domain.MemberBlock;
import java.time.LocalDateTime;

public record MemberBlockResult(
        Long memberId,
        LocalDateTime blockedAt
) {
    public static MemberBlockResult from(final MemberBlock memberBlock) {
        return new MemberBlockResult(memberBlock.getBlockedId(), memberBlock.getCreatedAt());
    }
}
