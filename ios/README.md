# GachiGacha iOS

`ios/GachiGacha.xcodeproj`는 웹 화면을 재사용하는 iOS 앱의 첫 WKWebView 셸입니다. 현재는 화면 탐색, 로딩/오류 표시, 다시 시도, 웹 히스토리 스와이프만 구현했습니다. 로그인·사진 업로드·푸시·딥링크는 이슈 #507의 후속 작업이며 아직 완료되지 않았습니다.

## 실행

1. Xcode에서 `GachiGacha.xcodeproj`를 엽니다.
2. `GachiGacha` 스킴과 iPhone 시뮬레이터를 선택해 실행합니다.
3. Debug는 `https://dev.gachigacha.kro.kr/trade`, Release는 `https://gachigacha.kro.kr/trade`를 엽니다. 주소와 Bundle ID는 `Config/*.xcconfig`에 정의되어 있습니다.

실기기 빌드에는 Apple 개발팀과 서명 설정이 필요합니다. 시뮬레이터 빌드는 `xcodebuild -project ios/GachiGacha.xcodeproj -scheme GachiGacha -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/gachigacha-ios-derived-data CODE_SIGNING_ALLOWED=NO build`로 확인할 수 있습니다.

## 현재 경계

- 웹 콘텐츠의 쿠키와 세션은 `WKWebsiteDataStore.default()`에 유지합니다. 네이티브 코드가 웹 토큰을 읽거나 전달하지 않습니다.
- HTTP(S) 이동과 새 창 요청은 같은 WebView에서 엽니다. 다른 URL 스킴은 iOS에 전달합니다. OAuth 제공자가 WKWebView를 허용하는지, 콜백 후 세션이 유지되는지는 실기기에서 확인해야 합니다.
- 카메라/사진 선택, 압축, 푸시, 딥링크, 외부 링크 정책은 아직 실기기 검증과 설계가 필요합니다.
