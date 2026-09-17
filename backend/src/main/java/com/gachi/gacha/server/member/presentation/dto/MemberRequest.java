package com.gachi.gacha.server.member.presentation.dto;

import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import jakarta.validation.constraints.NotBlank;

public record MemberRequest(
        @NotBlank(message = "사용자 이름은 필수입니다.") String nickname,
        String profileImageUrl,
        String desireTradeLocation
) {
    public MemberUpdateCommand toCommand() {
        return MemberUpdateCommand.builder()
                .nickname(nickname)
                .profileImageUrl(profileImageUrl)
                .desireTradeLocation(desireTradeLocation)
                .build();
    }
}
