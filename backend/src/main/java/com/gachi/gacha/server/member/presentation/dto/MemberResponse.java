package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.MemberInfo;
import lombok.Builder;

@Builder
public record MemberResponse(
        String nickname,
        String oauthUsername,
        String profileImageUrl,
        String desireTradeLocation
) {
    public static MemberResponse from(final MemberInfo memberInfo) {
        return MemberResponse.builder()
                .nickname(memberInfo.nickname())
                .oauthUsername(memberInfo.oauthUsername())
                .profileImageUrl(memberInfo.profileImageUrl())
                .desireTradeLocation(memberInfo.desireTradeLocation())
                .build();
    }
}
