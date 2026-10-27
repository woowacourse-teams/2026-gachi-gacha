package com.gachi.gacha.server.chat.domain;

import org.jspecify.annotations.Nullable;

/** 채팅방 응답에 필요한 회원 정보. 탈퇴 회원도 조회할 수 있도록 엔티티로 매핑하지 않는다. */
public interface ChatMemberSummary {
    Long getRoomId();

    Long getMemberId();

    String getNickname();

    @Nullable String getProfileImageUrl();

    Boolean getDeleted();
}
