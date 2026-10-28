package com.gachi.gacha.server.notification.application;

import java.util.List;

public interface PushSender {

    /**
     * 토큰들로 푸시를 보내고, 더 이상 쓸 수 없는 토큰을 돌려준다. 발송 실패는 예외로 던지지 않는다.
     */
    List<String> send(List<String> tokens, PushMessage message);
}
