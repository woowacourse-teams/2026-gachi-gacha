# Android WebView 하이브리드 셸 설계

## 결정

Android의 사용자 화면은 DEV/PROD에 배포된 GachiGacha 웹의 모바일 반응형 화면을
WebView로 표시한다. 거래/교환, 검색, 지도, 장소 검색, 마이페이지, 채팅, 알림 화면을
React Native로 다시 만들지 않는다.

이 결정의 목적은 iOS WebView 및 모바일 웹과 동일한 정보 구조, UI, 문구, 상태,
상호작용을 같은 배포본으로 보장하는 것이다. Android 작업은 `android/` 안에서만
수행하며 frontend를 Android 사정에 맞춰 변경하지 않는다.

## 책임 경계

| 영역 | 담당 |
| --- | --- |
| 화면·레이아웃·웹 라우팅·도메인 기능 | 배포된 GachiGacha 웹 |
| 카카오·네이버 OAuth 시작과 callback | Android Custom Tab + HTTPS App Link |
| 로그인 세션 재실행 복원 | Android SecureStore ↔ WebView sessionStorage 브리지 |
| Android 시스템 뒤로가기·종료 | Android 셸 |
| 상태 표시줄·시스템 내비게이션 안전 영역 | Android SafeAreaView |
| 외부 제휴·문의 링크 | 시스템 브라우저 |
| 푸시 권한·FCM 토큰·알림 탭 | Android 네이티브 계층 |
| 이미지·파일 선택과 공유 | WebView 파일 선택기 및 Android 네이티브 계층 |

## 탐색 보안

- WebView 안에는 현재 빌드 환경의 정확한 HTTPS origin만 허용한다.
- scheme과 origin을 URL 파서로 모두 확인하며 문자열 `startsWith`나 `contains`로
  신뢰 여부를 판단하지 않는다.
- `http:`, `javascript:`, `file:`, `content:` 탐색을 허용하지 않는다.
- 외부 HTTPS, 전화, 이메일 링크는 WebView가 아니라 운영체제에 전달한다.
- JavaScript 브리지 메시지는 현재 GachiGacha origin에서 온 경우에만 처리한다.
- mixed content와 로컬 파일 접근을 끈다.
- access token, refresh token, OAuth code, nonce, PKCE verifier를 로그에 남기지 않는다.

## 인증 흐름

1. 사용자가 웹 로그인 화면에서 카카오 또는 네이버를 선택한다.
2. Android가 `/api/v1/oauth/{provider}` 최상위 탐색을 차단한다.
3. 기존 모바일 nonce + PKCE 로그인을 Custom Tab에서 실행한다.
4. HTTPS App Link callback을 검증하고 백엔드에서 JSON 토큰을 받는다.
5. 토큰을 SecureStore에 저장한 뒤 WebView sessionStorage에 직접 주입하고 로그인
   화면을 다시 로드한다. 토큰은 URL query나 fragment에 붙이지 않는다.
6. 웹에서 refresh token이 회전하거나 로그아웃하면 제한된 메시지 브리지로
   SecureStore를 함께 갱신한다.

Android의 document-start JavaScript 실행은 기기 WebView 상태에 따라 누락될 수 있다.
따라서 네이티브는 스크립트를 실행했다고 세션 동기화가 끝난 것으로 간주하지 않는다.
페이지 로드가 끝날 때마다 SecureStore와 sessionStorage의 실제 토큰 값을 비교하고,
값이 다른 경우에만 토큰을 복원한 뒤 한 번 다시 로드한다. OAuth callback으로 앱
프로세스가 다시 만들어져도 같은 절차로 웹 로그인 상태를 복원한다.

Apple 로그인은 Android에서 지원하지 않으므로 Android 셸이 해당 웹 버튼을 숨기고
직접 탐색도 거부한다.

## 시스템 하단 영역

전체 WebView는 `SafeAreaView`의 top·bottom 안에만 배치한다. 따라서 웹의 footer,
고정 버튼, 채팅 입력창, 모달 하단 버튼이 제스처 또는 3버튼 내비게이션 영역 뒤로
들어가지 않는다. WebView 바깥의 안전 영역은 불투명한 흰색 배경을 가진다.

키보드에서는 Expo의 `softwareKeyboardLayoutMode=resize`가 WebView 가시 높이를 줄인다.
교환글 작성, 댓글, 채팅, 프로필 수정은 작은 화면과 큰 글자에서도 마지막 입력·저장
버튼까지 접근 가능한지 실기기로 확인한다.

배포 웹의 모바일 지도 오버레이가 Android 시스템 영역과 충돌할 때는 해시 형태의 CSS
class가 아니라 `aria-label`, role, 고정 id 같은 의미 기반 DOM을 찾아 Android 전용
data attribute를 붙인다. 초기 지원 지역 카드와 선택 가챠 카드, 재검색 버튼, 지도
컨트롤, 검색 결과 상태, 하단 캐러셀의 실제 경계를 측정해 간격을 맞추며 웹 소스는
변경하지 않는다. 위치 권한 오류는 접근성 알림으로 한 번 전달한 뒤 4초 후 시각적으로
닫는다.

채팅은 WebView 가시 너비와 높이를 기준으로 목록·대화방·입력창의 최소 너비를 다시
제한한다. 원격 프로필 이미지는 정상 디코딩된 경우 그대로 표시하고, URL이 없거나
이미지 요청이 실패한 경우에만 Android 공통 기본 프로필 이미지를 표시한다. 이미지
URL이나 사용자 정보는 네이티브 로그로 전달하지 않는다.

웹 지도의 현재 위치 버튼은 `geolocationEnabled`를 켠 Android WebView가 처리한다.
앱 manifest에는 대략적·정밀 위치 권한을 선언하지만 앱 시작 시 요청하지 않는다.
사용자가 현재 위치 버튼을 누른 시점에만 Android 시스템 권한 창을 표시한다.

## 푸시 알림 흐름

1. 인증 세션이 복구되면 Android가 알림 채널과 Android 13+ 권한을 확인한다.
2. Firebase 네이티브 device token을 받아 백엔드 `PUT /api/v1/push-tokens`에 등록한다.
3. FCM 토큰이 회전하거나 앱이 foreground로 돌아오면 같은 등록을 멱등 재시도한다.
4. 댓글 payload는 `/trade/{tradeId}`, 채팅 payload는 `/chat/{roomId}`로만 변환한다.
5. 알림을 누르면 허용된 숫자 경로만 WebView에 주입하며 임의 URL은 거부한다.
6. 로그아웃 전에 저장된 토큰을 서버에서 해제하고 SecureStore에서 삭제한다.

Firebase 클라이언트 설정이 없는 빌드에서는 위 흐름을 시작하지 않는다. Firebase Admin
서비스 계정은 Android 앱에 포함하지 않고 백엔드 비밀 저장소에서만 관리한다.

## Google Play 제출 관점

WebView 사용 자체가 제출 금지 사유는 아니다. GachiGacha는 팀이 소유한 서비스이며,
거래·지도·검색·채팅·알림이라는 실제 기능과 Android OAuth, App Links, 향후 FCM 푸시를
제공한다. 다만 심사 전에 다음을 반드시 확인한다.

- 네트워크 오류에서 빈 화면이나 멈춤 대신 재시도 화면이 보인다.
- 모든 핵심 경로가 안정적으로 동작하고 외부 사이트를 무단으로 감싸지 않는다.
- 제휴 카탈로그만 보여주는 앱으로 오해되지 않도록 핵심 교환 기능을 심사 메모와
  스토어 설명에 명확히 기재한다.
- 테스트 계정 또는 심사자가 로그인 기능을 확인할 방법을 Play Console에 제공한다.
- Data safety, 개인정보처리방침, 계정 삭제 경로가 실제 동작과 일치한다.

## 전환과 롤백

기본값은 `ANDROID_WEB_SHELL_ENABLED=true`다. QA 중 치명적인 WebView 호환성 문제가
확인될 때만 같은 코드에서 `ANDROID_WEB_SHELL_ENABLED=false`로 빌드해 기존 React
Native 화면과 비교한다. 기존 네이티브 화면 삭제는 로그인, 채팅, 지도, 업로드, 푸시,
뒤로가기, 프로세스 재생성 검증이 끝난 뒤 별도 이슈로 진행한다.

## 실기기 QA 체크리스트

- [ ] 카카오·네이버 로그인 성공, 취소, 재시도, 프로세스 재생성
- [ ] 앱 종료 후 로그인 세션 복원과 로그아웃 후 재로그인 방지
- [ ] 거래 목록·상세·댓글·작성·수정·삭제·신고·차단
- [ ] 지도 이동·검색·캡슐·캐러셀·상세 진입
- [ ] 현재 위치 버튼의 허용·거부·다시 시도
- [ ] 가챠 검색·더보기·제휴 링크·footer
- [ ] 마이페이지·프로필 수정·선호 거래 지역 검색·알림
- [ ] 채팅 목록·방·입력창·키보드·재연결
- [ ] foreground·background·종료 상태의 댓글·채팅 푸시와 딥링크
- [ ] 프로필 및 거래 이미지 선택·업로드
- [ ] 외부 링크 시스템 브라우저 전환과 앱 복귀
- [ ] Galaxy 제스처/3버튼, 작은 화면, 큰 글자, 화면 회전 차단
- [ ] 느린 네트워크·오프라인·HTTP 오류·재시도
