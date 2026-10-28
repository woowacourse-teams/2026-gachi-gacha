package com.gachi.gacha.server.notification.infra;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param pushEnabled             false 면 FCM 으로 보내지 않고 로그만 남긴다
 * @param serviceAccountKeyBase64 Firebase 서비스 계정 비공개 키(JSON) 파일 내용을 Base64 로 인코딩한 값
 */
@ConfigurationProperties("firebase")
public record FirebaseProperty(
        boolean pushEnabled,
        String serviceAccountKeyBase64
) {
}
