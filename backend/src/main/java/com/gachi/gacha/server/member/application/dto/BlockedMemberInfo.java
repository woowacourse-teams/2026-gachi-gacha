package com.gachi.gacha.server.member.application.dto;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberBlock;
import java.time.LocalDateTime;

public record BlockedMemberInfo(
        Long memberId,
        String nickname,
        LocalDateTime blockedAt
) {
    public static BlockedMemberInfo of(final MemberBlock memberBlock, final Member blockedMember) {
        return new BlockedMemberInfo(
                blockedMember.getId(),
                blockedMember.getNickname(),
                memberBlock.getCreatedAt()
        );
    }
}
