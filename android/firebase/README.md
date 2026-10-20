# Firebase Android 설정

Android 앱 등록은 아직 완료되지 않았습니다. Firebase Console에서 아래 두 앱을 각각 등록한 뒤 환경에 맞는 `google-services.json`을 내려받습니다.

| 환경 | Firebase 프로젝트 | Android application ID | 로컬 파일 |
| --- | --- | --- | --- |
| 개발 | `gachi-gacha-dev` | `com.dev.gachigacha.app` | `firebase/development.google-services.json` |
| 운영 | `gachi-gacha-prod` | `com.gachigacha.app` | `firebase/production.google-services.json` |

두 JSON은 클라이언트 식별 설정이며 서비스 계정 키와는 다릅니다. 현재는 CI와 로컬 환경에서 주입할 예정이므로 Git에 커밋하지 않습니다.

Firebase Admin 서비스 계정의 비공개 키는 앱에 포함하지 않습니다. 푸시 발송에 필요해지면 백엔드 또는 CI 비밀 저장소에서만 관리합니다.
