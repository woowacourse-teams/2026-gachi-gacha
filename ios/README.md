# GachiGacha iOS

`ios/`는 Expo·React Native 기반의 iOS 앱입니다. 기존 웹 화면은 `react-native-webview`로 표시합니다. Android 앱의 Expo SDK 및 React Native 버전과 맞추되, iOS 앱은 별도 폴더와 빌드 설정을 사용합니다.

## 실행

```bash
cd ios
nvm use
npm ci
npm run config:test
npm run typecheck
npm run ios:dev
```

`npm run ios:dev`는 Expo가 `ios/ios/` 네이티브 프로젝트를 재생성한 뒤 Xcode 시뮬레이터에서 실행합니다. `ios:prod`도 운영 설정으로 재생성하므로, 생성된 네이티브 폴더를 직접 수정하거나 보관하지 마세요. 실기기에는 Apple 개발팀 및 서명 설정이 필요합니다.

저장소의 한글 경로에서 CocoaPods가 Node 출력 경로를 바이너리 문자열로 처리해 설치에 실패하는 환경이 있어, Expo 설정 플러그인이 생성된 Podfile의 Node 출력만 유효한 UTF-8 문자열로 보정합니다.

`APP_VARIANT=development`는 `https://dev.gachigacha.kro.kr/trade`와 `com.dev.gachigacha.app`을, `APP_VARIANT=production`은 `https://gachigacha.kro.kr/trade`와 `com.gachigacha.app`을 사용합니다. 기본값은 development입니다.

## 현재 경계

- 웹 화면의 쿠키와 세션은 WebView가 유지합니다. 네이티브 코드는 웹 토큰을 읽거나 전달하지 않습니다.
- HTTPS 이동은 WebView에 남기고 HTTP·전화·문자·이메일 링크는 OS에 넘깁니다. OAuth 제공자의 WKWebView 지원과 콜백 복귀는 실기기에서 검증해야 합니다.
- 사진 선택·압축, 푸시, 딥링크, 새 창 및 외부 링크 정책은 이슈 #507의 후속 작업입니다. 현재 구현을 완료된 iOS 앱으로 간주하지 않습니다.
