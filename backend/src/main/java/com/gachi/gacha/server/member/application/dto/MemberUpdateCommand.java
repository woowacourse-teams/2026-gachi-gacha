package com.gachi.gacha.server.member.application.dto;

import lombok.Builder;

@Builder
public record MemberUpdateCommand(
        String nickname,
        String profileImageUrl,
        String desireTradeLocation
) {
}
