package com.gachi.gacha.server.notification.application;

import java.util.Map;
import org.jspecify.annotations.Nullable;

/**
 * 플랫폼과 무관한 푸시 내용. FCM 메시지로 바꾸는 일은 {@link PushSender} 구현체가 맡는다.
 *
 * @param data        앱이 알림을 눌렀을 때 읽는 값. FCM 제약으로 값은 모두 문자열이다.
 * @param collapseKey 같은 값의 알림은 기기에서 최신 것 하나로 교체된다. {@code null}이면 교체하지 않는다.
 */
public record PushMessage(
        String title,
        String body,
        Map<String, String> data,
        @Nullable String collapseKey
) {
}
