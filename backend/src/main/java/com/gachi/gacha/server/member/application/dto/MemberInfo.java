package com.gachi.gacha.server.member.application.dto;

import com.gachi.gacha.server.member.domain.Member;
import lombok.Builder;

@Builder
public record MemberInfo(
        String nickname,
        String oauthUsername,
        String profileImageUrl,
        String desireTradeLocation
) {
    public static MemberInfo from(final Member member) {
        return MemberInfo.builder()
                .nickname(member.getNickname())
                .oauthUsername(member.getOauthUsername())
                .profileImageUrl(member.getProfileImageUrl())
                .desireTradeLocation(member.getDesireTradeLocation())
                .build();
    }
}
