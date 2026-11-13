# Android 앱 접속 환경 브릿지 v1

이 브릿지는 이벤트 응모 시 **현재 Android WebView에서 요청했다는 클라이언트 신호**를
웹이 읽도록 제공한다. Play 설치 인증, 회원 본인 인증, 응모 성공 증명이 아니다.
DEV APK에서도 `environment: "development"`로 동작한다.

## 제공 API

```ts
window.GachiGachaNative?.getAppContext(): Promise<{
  schemaVersion: 1;
  platform: 'ANDROID';
  appVersion: string;
  versionCode: number;
  environment: 'development' | 'production';
  verification: 'client-signal';
} | null>
```

앱 버전·버전 코드는 현재 빌드에 포함된 Expo config에서 읽는다. 웹 마이페이지의
서비스 버전과 다른 값이다. 환경도 `extra.appVariant`를 사용하며 하드코딩하지 않는다.
설정 누락, 브릿지 부재, 응답 지연(2초), 페이지 이탈 시 `null`을 반환한다.
회원 ID, 액세스/리프레시 토큰, FCM 토큰, 광고 ID, 영구 기기 식별자는 제공하지 않는다.

기존 `isInNativeApp()` / `window.ReactNativeWebView.postMessage`는 변경하지 않는다.
기존 웹·iOS가 이 새 API를 호출하지 않아도 로그인·푸시·응모 동작은 달라지지 않는다.

## 향후 이벤트 웹에서 사용할 예시

아래는 계약 설명이며 이번 Android 작업에서 웹 파일은 수정하지 않았다.

```ts
// 실제 제출 직전에 호출한다. 클릭 자체가 응모 성공을 뜻하지는 않는다.
const nativeContext =
  (await window.GachiGachaNative?.getAppContext?.()) ?? null;

await submitEventApplication({
  ...validatedApplication,
  nativeContext,
});
```

웹 담당자는 타입과 제출 payload에 `nativeContext`를 추가하고, Apps Script 담당자는
허용한 필드만 명시적으로 Google Sheets 열에 기록해야 한다. 현재 기존 응모는 고정
필드를 JSON으로 보내고 스크립트도 고정 열만 기록하므로 **APK를 설치하는 것만으로
응모 시트에 앱 신호가 자동 추가되지 않는다**. 앱 감지 실패 시 참여를 허용할지,
안내 후 재시도시킬지는 이벤트 운영 정책으로 결정한다. 이 문서의 예시는 가짜 성공이나
자동 응모를 만들지 않는다.

이 계약을 지원하는 앱이 배포된 뒤 이벤트 문구·기간·폼·전송 필드·시트 처리는 웹과
Apps Script 배포로 변경할 수 있다. 새로운 네이티브 기능이나 계약 변경에는 앱 업데이트가
필요할 수 있다. 모든 미래 웹 변경에 앱 재심사가 불필요하다고 보장하지 않는다.

## 전송 계약과 안전 경계

웹 → 앱:

```json
{"type":"gachigacha:app-context-request","schemaVersion":1,"requestId":"document_1_1"}
```

앱 → 같은 웹 문서의 `CustomEvent("gachigacha:app-context")`:

```json
{
  "schemaVersion": 1,
  "requestId": "document_1_1",
  "context": {
    "schemaVersion": 1,
    "platform": "ANDROID",
    "appVersion": "1.0.0",
    "versionCode": 5,
    "environment": "production",
    "verification": "client-signal"
  }
}
```

위 버전 값은 예시다. `requestId`는 요청·응답 연결 용도이며 보안 nonce나 기기 ID가 아니다.
`context`는 응답 실패 시 `null`이다.

- 현재 앱에 설정한 HTTPS origin의 최상위 문서에만 API를 설치한다.
- 네이티브 수신 시 기존 origin 검사를 거치고, 응답 주입 시 현재 문서 origin과
  최상위 프레임을 다시 확인한다.
- 초기 주입이 늦어지는 Android WebView를 위해 문서 시작/로드 후에 멱등 설치한다.
- 요청 ID·스키마·응답 필드 검증, 동시 요청 16개 제한, 타임아웃/이탈 정리를 적용한다.
- 앱 브릿지가 페이지 내 JavaScript 위조를 막아 주지는 않는다. 토큰에 서명하거나
  Play Integrity를 실행하지 않으므로 이 응답만으로 당첨 자격을 확정하면 안 된다.
- 폼의 버튼 문구나 DOM 구조를 찾아 자동 클릭하거나 `fetch`를 가로채지 않는다.
  이벤트 화면이 바뀌어도 앱은 응모 UI를 다시 구현하지 않는다.

엄격한 증명이 필요하면 백엔드가 인증 세션으로 회원을 결정하고, 응모 요청과 연결된
Play Integrity 응답·재사용 방지 값·거래글 소유권을 검증하는 별도 흐름을 도입해야 한다.
Google Sheets의 임의 `memberId`나 `nativeContext`를 신뢰하는 방식과 구분한다.

## 검증

```sh
node --no-warnings --experimental-strip-types --test scripts/web-shell-app-context.test.mjs
```

계약·설정값·멱등 설치·동시/역순 응답·미지원·타임아웃·외부 origin/iframe·페이지 이탈을
테스트한다. 실제 시트 저장은 웹/Apps Script 연동 후 별도 DEV 테스트 응모로 확인해야 한다.

## 공식 참고

- [React Native WebView 통신과 onMessage](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md#communicating-between-js-and-native)
- [Android 초기 스크립트 주입의 제약](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#injectedjavascriptbeforecontentloaded)
- [Android WebView 브릿지 보안](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges)
- [Play Integrity 판정값](https://developer.android.com/google/play/integrity/verdicts)
