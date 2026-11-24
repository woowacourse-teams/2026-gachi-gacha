package com.gachi.gacha.server.notification.application;

import java.util.List;

public interface PushSender {

    /**
     * 토큰들로 푸시를 보내고 결과(성공·실패·알 수 없음 수, 무효 토큰)를 돌려준다. 발송 실패는 예외로 던지지 않는다.
     * FCM 한도에 맞춰 토큰이 많으면 나눠서 보낸다.
     */
    PushResult sendWithResult(List<String> tokens, PushMessage message);

    /**
     * 토큰들로 푸시를 보내고, 더 이상 쓸 수 없는 토큰을 돌려준다. 결과가 필요 없는 알림(채팅·댓글)이 쓴다.
     */
    default List<String> send(final List<String> tokens, final PushMessage message) {
        return sendWithResult(tokens, message).invalidTokens();
    }
}
