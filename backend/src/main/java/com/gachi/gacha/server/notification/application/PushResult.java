package com.gachi.gacha.server.notification.application;

import java.util.ArrayList;
import java.util.List;

/**
 * 푸시를 보낸 결과. 토큰(기기) 수 단위로 센다.
 *
 * <p>"성공"은 FCM 이 요청을 받아들였다는 뜻이지 기기에 도착했다는 뜻이 아니다.
 *
 * @param successCount  FCM 이 받아들인 토큰 수
 * @param failureCount  FCM 이 받지 않았다고 알려 준 토큰 수(무효 토큰 포함). 일시 오류는 한 번 다시 시도한 뒤의 결과다
 * @param unknownCount  호출 자체가 예외로 끝나 받아들여졌는지 알 수 없는 토큰 수. 다시 보내면 중복될 수 있어서 재발송하지 않는다
 * @param invalidTokens 더 이상 쓸 수 없는 토큰(앱을 지웠거나 다른 Firebase 프로젝트의 토큰)
 */
public record PushResult(int successCount, int failureCount, int unknownCount, List<String> invalidTokens) {

    /**
     * 실제로 보내지 않았다(푸시 비활성 환경). 모든 수가 0이라 보낸 토큰 수와 합이 맞지 않는 것으로 알 수 있다.
     */
    public static final PushResult NONE = new PushResult(0, 0, 0, List.of());

    public PushResult {
        invalidTokens = List.copyOf(invalidTokens);
    }

    public PushResult plus(final PushResult other) {
        List<String> invalid = new ArrayList<>(invalidTokens);
        invalid.addAll(other.invalidTokens);
        return new PushResult(successCount + other.successCount, failureCount + other.failureCount,
                unknownCount + other.unknownCount, invalid);
    }
}
