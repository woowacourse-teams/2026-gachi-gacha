package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import lombok.Builder;

@Builder
public record MemberDeleteResponse(
        Long memberId
) {
    public static MemberDeleteResponse from(MemberDeleteResult result) {
        return MemberDeleteResponse.builder()
                .memberId(result.memberId())
                .build();
    }
}
