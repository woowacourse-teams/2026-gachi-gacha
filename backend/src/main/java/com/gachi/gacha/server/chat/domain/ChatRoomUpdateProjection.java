package com.gachi.gacha.server.chat.domain;

import java.time.LocalDateTime;
import org.jspecify.annotations.Nullable;

/** 채팅방 목록 갱신 메시지에 필요한 값을 한 번의 조회로 반환한다. */
public interface ChatRoomUpdateProjection {

    Long getRoomId();

    @Nullable Long getMyMembershipId();

    Long getTradeId();

    String getTradeTitle();

    String getTradeStatus();

    Boolean getTradeDeleted();

    @Nullable String getThumbnailUrl();

    Long getOtherMemberId();

    String getOtherMemberNickname();

    @Nullable String getOtherMemberProfileImageUrl();

    Boolean getOtherMemberDeleted();

    Boolean getBlocked();

    @Nullable String getLastMessagePreview();

    @Nullable LocalDateTime getLastMessageAt();

    long getUnreadCount();

    LocalDateTime getCreatedAt();
}
