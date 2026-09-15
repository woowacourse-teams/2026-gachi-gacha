package com.gachi.gacha.server.member.application.dto;

import com.gachi.gacha.server.member.domain.Member;

public record LoginInfo(
        Long memberId
) {
    public static LoginInfo from(Member member) {
        return new LoginInfo(member.getId());
    }
}
