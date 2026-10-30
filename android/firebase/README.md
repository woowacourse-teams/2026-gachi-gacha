# Firebase Android 설정

Android 앱 등록은 아직 완료되지 않았습니다. Firebase Console에서 아래 두 앱을 각각
등록한 뒤 환경에 맞는 `google-services.json`을 내려받습니다.

| 환경 | Firebase 프로젝트 | Android application ID | 로컬 파일 |
| --- | --- | --- | --- |
| 개발 | `gachi-gacha-dev` | `com.dev.gachigacha.app` | `firebase/development.google-services.json` |
| 운영 | `gachi-gacha-prod` | `com.gachigacha.app` | `firebase/production.google-services.json` |

두 JSON은 클라이언트 식별 설정이며 서비스 계정 키와는 다릅니다. Git에 커밋하지
않고 로컬 또는 CI 빌드 시 위의 고정 경로에 주입합니다. 파일이 없으면 앱은 기존
기능을 그대로 빌드하되 푸시 등록만 비활성화합니다.

## Firebase Console 설정

1. 개발·운영 Firebase 프로젝트에서 각각 Android 앱 추가를 선택합니다.
2. 표의 application ID를 정확히 등록합니다.
3. 내려받은 `google-services.json`을 표의 로컬 파일명으로 둡니다.
4. Firebase Cloud Messaging API가 프로젝트에서 활성화됐는지 확인합니다.

SHA 인증서는 Google 로그인이나 Dynamic Links를 쓰지 않는 현재 FCM 토큰 수신 자체에는
필수 입력이 아니다. OAuth App Link용 `assetlinks.json`의 SHA-256과도 역할이 다르다.

## 서버 설정

Firebase Admin 서비스 계정의 비공개 키는 APK나 `google-services.json`에 포함하지
않습니다. 백엔드 배포 환경의 비밀 저장소에만 다음을 설정합니다.

```text
FCM_PUSH_ENABLED=true
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=<해당 환경 서비스 계정 JSON의 base64>
```

앱은 로그인 후 FCM device token을 `PUT /api/v1/push-tokens`로 등록하고 로그아웃 전에
`DELETE /api/v1/push-tokens`로 해제합니다. 댓글 알림은 해당 교환글, 채팅 알림은 해당
채팅방으로 이동합니다.

## CI 주입

`firebase/*.json`은 저장소에서 무시됩니다. 따라서 GitHub Actions APK에서 실제 푸시를
시험하려면 개발용 JSON 전체를 GitHub Actions secret으로 보관하고, Android 빌드 전에
`android/firebase/development.google-services.json`으로 복원하는 CI 작업이 추가로
필요합니다. 운영 JSON은 Play 출시 workflow에서만 같은 방식으로 주입합니다.
