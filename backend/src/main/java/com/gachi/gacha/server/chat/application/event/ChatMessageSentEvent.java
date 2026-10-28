package com.gachi.gacha.server.chat.application.event;

/**
 * 커밋 이후 다른 스레드에서 처리되므로 엔티티 대신 필요한 값만 담는다.
 *
 * @param preview 채팅방 목록에 쓰는 마지막 메시지 미리보기. 사진·파일이면 "사진", "파일"이다.
 */
public record ChatMessageSentEvent(
        Long roomId,
        Long senderId,
        String preview
) {
}
