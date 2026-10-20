# Android 개발 기준

## 기술 선택

- Expo SDK 57 / React Native 0.86
- TypeScript strict mode
- React Native New Architecture
- WebView로 웹을 감싸지 않고 React Native 네이티브 컴포넌트로 화면을 다시 구현한다.
- 알림, 로그인처럼 계약 변경 가능성이 큰 기능은 기반이 안정된 다음 별도 이슈로 추가한다.

Expo는 React Native 프레임워크입니다. 향후 Firebase Messaging이나 소셜 로그인처럼 네이티브 설정이 필요한 기능은 Expo development build와 config plugin을 사용하고, 필요한 경우 생성된 Android 네이티브 프로젝트를 직접 수정합니다.

## 브랜치 흐름

```text
feat/<issue>-android-* -> android -> main
```

- `android`: Android 통합·테스트 브랜치
- 기능 개발은 이슈마다 `android`에서 브랜치를 생성한다.
- Android 기능 브랜치에서는 루트 `android/`와 Android 전용 CI만 변경한다.
- `main` 병합은 테스트 버전 확인 후 코드 보관과 릴리스 이력 통합을 위해 진행한다.
- iOS 작업은 `ios` 브랜치와 루트 `ios/`에서 별도로 진행한다.

## 환경 구분

| 환경 | APP_VARIANT | 앱 이름 | application ID | URL scheme |
| --- | --- | --- | --- | --- |
| 개발 | `development` | 가치가챠 Dev | `com.dev.gachigacha.app` | `gachigacha-dev` |
| 운영 | `production` | 가치가챠 | `com.gachigacha.app` | `gachigacha` |

Android에서는 iOS의 Bundle ID에 대응하는 값을 `applicationId` 또는 package name이라고 부릅니다. Play Console에서도 위 두 ID는 서로 다른 앱으로 취급됩니다.

## 로컬 준비

VS Code에서 TypeScript와 React Native 코드를 작성할 수 있습니다. Android 네이티브 빌드와 에뮬레이터 사용을 위해서는 다음 도구가 추가로 필요합니다.

1. Node.js 22.13 이상 25 미만
2. JDK 17
3. Android Studio
4. Android SDK Platform과 Build Tools
5. Android Emulator 또는 USB 디버깅을 활성화한 실제 기기

설치 후 `JAVA_HOME`과 `ANDROID_HOME`을 설정합니다.

## 명령어

```bash
cd android
npm ci
npm run check
npm run android:dev
```

`npm run check`는 TypeScript, 개발·운영 앱 설정, 두 환경의 Android JS 번들을 검증합니다. 실제 APK/AAB 네이티브 빌드는 JDK와 Android SDK가 준비된 환경에서 추가로 확인합니다.
