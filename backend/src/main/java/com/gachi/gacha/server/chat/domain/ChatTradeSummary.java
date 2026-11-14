package com.gachi.gacha.server.chat.domain;

/** 채팅방 응답에 필요한 게시글 정보. 삭제된 게시글도 조회할 수 있도록 엔티티로 매핑하지 않는다. */
public interface ChatTradeSummary {
    Long getTradeId();

    String getTitle();

    String getStatus();

    Boolean getDeleted();

    default boolean isRemoved() {
        return Boolean.TRUE.equals(getDeleted());
    }
}
