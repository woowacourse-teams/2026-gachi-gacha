# Android 웹 모바일 UX 일치와 안전 영역 원칙

Android 기능과 UI를 구현할 때의 제품 기준은 작업 브랜치 생성 시점의 최신 웹
`main` 모바일 반응형 뷰다. Android는 화면을 새로 해석하는 별도 제품이 아니며,
기기 기능이 필요한 부분만 네이티브 구현으로 대체한다.

현재 기본 구조는 웹 모바일 화면 전체를 WebView로 제공한다. 아래 포팅 원칙은
`ANDROID_WEB_SHELL_ENABLED=false` 비상 경로에서 기존 React Native 화면을 유지하거나,
WebView 위에 네이티브 기능을 추가할 때만 적용한다.

## 지도 카드와 하단 탭의 Android 보정 (#697)

### 2026-11-13 거래 상세·채팅 DEV QA 후속

웹 기준은 `origin/main` `f342e479`이며 `frontend/`와 iOS는 수정하지 않는다.

- 거래 설명의 긴 무공백 문자열이 문서 가로 폭을 늘리고, 모바일 Chromium의 고정
  하단 버튼까지 화면보다 넓히는 현상을 실제 웹 `TradeDetailPage`로 재현했다.
  사용자 스크린샷도 페이지 전체의 가로 이동을 보여 주지만, 해당 글의 실제 설명
  데이터는 확인하지 않았다. 댓글 제목 landmark가 있는 상세 article에만 모바일
  `overflow-wrap: anywhere`를 적용한다. 전체 문서를 잘라 숨기거나 캐러셀을 막지 않는다.
  채팅 drawer 뒤에 유지되는 상세에도 줄바꿈을 유지한다.
- 상세의 채팅/로그인 진입 바와 채팅 작성창은 네이티브가 이미 확보한 하단 인셋을
  다시 더하지 않는다. 웹의 현재 위쪽 기본 패딩을 아래에도 사용하며 좌우 값, 버튼
  동작·색상·텍스트는 유지한다. 현재 웹은 각 영역의 기본 상하 패딩이 같은 계약이다.
- 채팅 메시지 pane의 실제 크기 변경을 관찰한다. 기존에 최신 메시지를 보고 있었다면
  키보드 열기·닫기와 사진 미리보기로 높이가 바뀌어도 하단을 유지한다. 과거 메시지를
  읽고 있거나 크기 변경 중 직접 스크롤하면 강제로 하단으로 이동하지 않는다.
  메시지 추가·이전 메시지 로딩은 기존 웹 로직이 처리하며 관찰자는 내용만 바뀔 때
  스크롤하지 않는다. 경로 이탈·방 닫기·태블릿 전환에는 관찰자와 리스너를 해제한다.
- `SafeAreaView`, WebView의 키보드 resize 설정, 인증·푸시·메시지 전송 계약은 바꾸지
  않는다. 실제 WebView 버전별 IME 동작은 DEV APK로 추가 확인한다.

실제 웹 컴포넌트를 읽기 전용으로 사용하는 추가 회귀 명령:

```sh
ANDROID_TEST_CHROME=<Chromium 실행 파일> \
ANDROID_TEST_FRONTEND_SOURCE=<최신 frontend 경로> \
ANDROID_TEST_FRONTEND_NODE_MODULES=<설치된 frontend/node_modules> \
npm run web-shell:detail-layout-test

ANDROID_TEST_CHROME=<Chromium 실행 파일> \
ANDROID_TEST_FRONTEND_SOURCE=<최신 frontend 경로> \
ANDROID_TEST_FRONTEND_NODE_MODULES=<설치된 frontend/node_modules> \
npm run web-shell:chat-layout-test
```

DEV 실기기 확인: 상세의 긴 설명과 다른 교환 물품 가로 탐색, 채팅하기 좌우/하단 경계,
키보드 열기·닫기 후 최신 메시지, 과거 대화 읽기 중 키보드와 스크롤, 사진 첨부/취소,
채팅 닫기/시스템 뒤로가기. 3버튼·제스처 및 작은 화면·큰 글씨에서 확인한다.

### 2026-11-13 DEV QA 후속 보정

웹 기준은 `origin/main` `f342e479`, 이전 Android QA 기준은 `9ab73212`다.
사용자는 이전 APK의 지도 카드/탭 배치를 확인했지만 나머지 탭의 여백을 추가 제보했다.

- 지도에만 적용했던 하단 중복 인셋 제거를 보이는 공통 `하단 메뉴` 전체에 적용한다.
  네이티브 `SafeAreaView`와 키보드 처리는 유지한다. 홈·채팅 목록·마이페이지의 본문
  하단 공간도 실제 탭 높이로 확보하며, 홈은 글쓰기 버튼 높이와 위아래 16px를 더한다.
- Android WebView에서만 `#site-footer`를 숨긴다. 웹/iOS 푸터와 마이페이지의
  개인정보처리방침·고객 지원 링크는 변경하지 않는다. 글쓰기 버튼은 웹 푸터 회피값을
  사용하지 않고 실제 탭 상단에서 16px 위에 고정한다. 상세·등록 버튼은 대상이 아니다.
- 지도 선택 가챠 카드 뒤 타원은 웹 `ListHeaderArea`의 별도 흰 배경과 테두리다.
  선택 카드/불러오기/오류 상태에서만 wrapper 장식을 없애고 검색창 좌우 경계에 맞춘다.
  서비스 지역 밖 안내는 기존 표시를 유지한다.
- 검색창 상단 여백은 웹 검색 layer의 좌우 여백과 같게 한다. 검색창→선택 카드→
  재검색 간격은 목록 보기→캐러셀의 현재 간격(기본 10px)을 공유한다.
- GPS와 확대·축소의 내부 간격은 웹이 소유한다. 전체 컨트롤 그룹의 아래쪽만 실제
  캐러셀 또는 로딩/빈 결과/오류 카드 위로 옮긴다. 목록 보기 버튼 높이는 더하지 않는다.
- 안정적인 기존 의미 속성(`aria-label`, `id`, `data-placement`)만 사용하고 DOM을
  재배치하거나 React 이벤트/네트워크를 가로채지 않는다. 크기 변화는 ResizeObserver,
  작업 합치기는 requestAnimationFrame을 사용한다. SPA 이탈·탭 제거·태블릿 폭에서는
  해당 모바일 보정 마커와 측정값을 정리한다. 대상이 없으면 보정하지 않는다.
- 앱 환경 브릿지는 [별도 계약](./native-app-context.md)을 제공한다. 설치 인증이나
  시트 전송 완료를 의미하지 않는다. 웹·Apps Script 연결은 별도 작업이다.

구조상 웹은 화면을, 네이티브는 시스템 인셋과 OS 기능을 소유하는 것이 기본이다.
현재는 웹 수정이 금지되어 앱 안의 작은 호환 보정 계층을 사용한다. 웹의 문구·데이터·
카드 크기 변경은 재측정하지만, 의미 속성/페이지 구조가 바뀌면 보정 수정과 새 앱 배포가
필요할 수 있다. 장기적으로 웹이 공통 CSS 변수/의미 속성 계약을 직접 지원하면 이 보정을
줄일 수 있다. 원격 웹 코드에 대한 임의 실행 권한이나 별도 원격 패치 로더는 추가하지 않는다.

이번 산출물은 DEV QA APK까지다. 운영 versionName/versionCode, AAB, Play 제출과
`android`/`main` 병합은 하지 않는다. 아래 이전 작업 기록의 'PR까지만'은 최초 #697 범위다.

공식 참고: [WebView 인셋의 버전별 지원](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets),
[React Native WebView 초기 스크립트 주입 제약](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#injectedjavascriptbeforecontentloaded).

실기기 재확인: 홈/채팅/마이/지도 탭 왕복, 최하단 더보기와 글쓰기, 길고 짧은 상품명,
지도 일반/선택/오류/목록창, 가로 회전, 제스처/3버튼, 큰 글씨, 채팅 키보드와 파일 선택.
브라우저 검증은 실제 Galaxy/Pixel의 WebView·접근성 설정 검증을 대신하지 않는다.

조사 기준은 Android `0fc65afb`와 웹 `main` `f342e479`다. 출시 versionCode 5의
지도 보정 코드도 조사 기준 Android 코드와 같다. 원격 웹이 갱신되어도 앱에 포함된
주입 스크립트는 자동으로 교체되지 않는다.

- 확인된 원인: 이전 Android 스타일의 `bottom: 12px !important`가 웹 카드 영역의
  `bottom: calc(78px + env(safe-area-inset-bottom))`를 덮어써 하단 탭 공간을 없앴다.
  기존 컨트롤 위치 측정도 현재 모바일 웹에서는 숨겨진 상태 행을 기준으로 했다.
- 하단 흰 여백: 네이티브 `SafeAreaView`가 시스템 인셋을 이미 확보하는 것은 코드로
  확인했다. 웹 탭의 `env(safe-area-inset-bottom)`까지 적용되면 여백이 중복된다.
  다만 제보 기기의 WebView 버전과 실제 CSS 인셋 값은 아직 측정하지 않았으므로,
  이 기기의 공백 전체가 중복 인셋 때문이라고 단정하지 않는다.
- 변경은 767px 이하의 Android 지도에만 적용한다. 지도 `main` 안의 하단 메뉴 패딩을
  0으로 만들고, 실제 메뉴 상단에서 21px 위에 카드 영역의 하단을 배치한다.
  21px은 웹 기본 카드 하단 78px에서 메뉴 높이 57px을 뺀 디자인 간격이며,
  시스템 내비게이션 바 높이를 고정값으로 가정한 것이 아니다.
- 지도 컨트롤은 숨겨진 제목 대신 실제 카드/로딩/빈 결과/오류 영역 상단을 기준으로
  10px 위에 둔다. 메뉴·목록 크기 변화는 `ResizeObserver`로 다시 측정한다.
- 지도 이탈·메뉴 제거·태블릿 폭에서는 소유한 하단 보정 마커와 측정값을 정리한다.
  네이티브 안전영역, 키보드 처리, 웹의 카드 클릭·가로 탐색·목록 창은 유지한다.
- `frontend/`, iOS, 인증·푸시 계약은 변경하지 않는다. 이번 작업은 PR까지만이며
  버전 코드 변경, APK/AAB 생성, 병합과 Play 제출은 포함하지 않는다.

실제 웹 스타일과 `StoreListPanel`/`StoreCard`를 읽기 전용으로 사용하는 검증:

```sh
ANDROID_TEST_CHROME=<Chromium 실행 파일> \
ANDROID_TEST_FRONTEND_SOURCE=<최신 frontend 경로> \
ANDROID_TEST_FRONTEND_NODE_MODULES=<설치된 frontend/node_modules> \
npm run web-shell:map-layout-test
```

테스트는 카카오 지도 SDK와 네트워크만 대체하고, CDP의 실제 CSS safe-area override로
0/24/48px 인셋, 여러 모바일 폭, 큰 탭 높이, 상태 전환과 SPA 왕복을 확인한다.
이는 실제 Galaxy/Pixel WebView나 iOS 실기기 테스트를 대신하지 않는다. 승인 후 DEV
QA에서 3버튼/제스처, 작은 화면/큰 글씨, 가로 회전/멀티윈도, 검색 키보드 열기·닫기,
카드 스와이프·매장 상세·목록 창·지도 확대·현재 위치 권한 왕복을 확인해야 한다.
실제 사용자 반영에는 이후 별도 승인으로 Android 번들 업데이트와 Play 검토가 필요하다.

인셋 처리 기준: [Android WebView 공식 문서](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets).
이미 네이티브에서 확보한 시스템 인셋의 중복 적용을 피하되, IME 인셋까지 일괄 소비하거나
기존 `SafeAreaView`를 제거하는 변경은 하지 않는다.

## 거래 작성·수정의 Android 터치 보정 (#630)

2026-11-05 사용자 승인에 따라 Android WebView에서 다음 예외를 적용한다.
기준 웹 소스는 `origin/main`의 `40f8d246`이며, 웹의 File 상태와 정렬·삭제 구현을 유지한다.

- 767px 이하에서 사진 본문은 가로 스와이프로 탐색하고, 사진 아래 44px 높이의 `순서 변경` 손잡이로
  정렬한다. 사진 본문의 touch/pen `pointerdown`만 React 정렬 시작에서 분리하며,
  기본 스크롤과 `pointerup`/`pointercancel`은 막지 않는다.
- 화면에 세 칸 정도가 보이도록 카드 폭을 88–144px로 제한한다. 두 장 이상인
  새 업로드 사진에만 손잡이를 추가하며, 기존 서버 사진의 재정렬을 새로 구현하지 않는다.
- 삭제·갤러리 선택·키보드 방향키 정렬은 웹 동작을 유지한다. 손잡이만 adapter가
  소유하고, SPA 이동·데스크톱 폭 전환 시 해당 표시를 정리한다.
- 등록/수정 버튼 바의 안쪽 여백은 상하좌우 24px다. WebView 전체가 이미 네이티브
  `SafeAreaView`의 bottom 안에 있으므로 웹 바에 시스템 하단 인셋을 다시 더하지 않는다.
- 버튼 바 보정은 가로 회전·태블릿 너비에서도 유지한다. 넓은 화면의 원래 버튼 영역
  최대 너비 960px는 유지하므로, 화면 가장자리까지의 거리와 내부 24px 여백은 구별한다.
- 사이트 공통 푸터는 이 adapter가 숨기지 않는다. `/trade/new`와 끝 슬래시 경로에서만
  제외하는 웹 변경은 별도 승인된 #631 / frontend-dev 범위다.

실제 웹 `PhotoUploader`·`StickyActionBar`를 읽기 전용으로 불러오는 회귀 테스트:

```sh
ANDROID_TEST_CHROME=<Chromium 실행 파일> \
ANDROID_TEST_FRONTEND_SOURCE=<최신 frontend 경로> \
ANDROID_TEST_FRONTEND_NODE_MODULES=<해당 frontend/node_modules> \
npm run web-shell:trade-layout-test
```

브라우저 검증과 별도로 DEV APK에서 사진 1/2/5장 탐색·손잡이 정렬·삭제·갤러리 복귀,
3버튼/제스처 내비게이션의 좌우·하단 여백, 키보드 표시와 마지막 입력을 확인한다.

## 포팅 기준

1. 작업을 시작하기 전에 최신 `origin/main`을 받아 대응하는 웹 route, feature,
   dialog와 API 계약을 확인한다.
2. 정보 구조, 문구, 필드 순서, 진입점, 선택·취소·재시도 흐름, 로딩·빈 결과·오류
   상태를 웹 모바일 뷰와 동일하게 유지한다.
3. 네이티브 SDK나 기기 권한 때문에 다른 구현이 필요해도 사용자가 거치는 반응
   순서는 유지한다. 웹에 없는 입력 방식이나 중복 메뉴를 임의로 추가하지 않는다.
4. 제품 동선 변경이 필요하면 구현 전에 차이와 이유를 이슈에 기록하고 승인을
   받는다.

## Android 시스템 하단 영역

Android는 제스처 내비게이션과 3버튼 내비게이션 모두 edge-to-edge 영역을 사용한다.
시스템 내비게이션 바의 위쪽 경계를 앱 사용자 뷰의 최하단으로 취급한다.

- 전체 화면의 `ScrollView`·`FlatList` 마지막 콘텐츠는 `insets.bottom`과 콘텐츠
  여백을 합한 padding을 가져야 한다.
- 채팅 입력창, 저장·확인 버튼, bottom sheet처럼 하단에 붙는 UI는
  `insets.bottom`을 포함한 padding 안쪽에 배치한다.
- 시스템 내비게이션 바 뒤로 카드, 텍스트, 버튼, 이미지가 비치지 않게 하단
  컨테이너가 불투명한 배경을 소유해야 한다.
- 고정 숫자만으로 하단 여백을 만들지 않는다. 공통
  `useBottomContentPadding`을 사용한다.
- 모달과 새 화면을 추가할 때 작은 화면, 큰 글자, 키보드 표시, 3버튼과 제스처
  내비게이션을 모두 확인한다.

## 변경 전 체크리스트

- [ ] 최신 웹 `main`의 대응 화면과 사용자 동선을 확인했다.
- [ ] Android에서 새로 생긴 문구·필드·버튼·중복 메뉴가 없다.
- [ ] 로딩, 빈 결과, 오류, 재시도 상태가 웹과 같은 의미를 전달한다.
- [ ] 스크롤 마지막 항목과 하단 고정 UI에 시스템 하단 인셋을 적용했다.
- [ ] 키보드가 열린 상태에서도 입력·저장 버튼을 누를 수 있다.
- [ ] Galaxy 3버튼/제스처와 작은 화면에서 하단 콘텐츠가 가려지지 않는다.

## 현재 공통 구현

- 기본 UI: `WebAppShellScreen`
  - 빌드 환경의 배포된 웹 origin을 그대로 사용
  - 웹과 같은 거래, 장소 검색, 지도, 채팅, 알림, 마이페이지 화면 제공
- 네이티브 경계: `webShellPolicy`
  - 카카오·네이버 OAuth 탐색만 Custom Tab으로 전환
  - 정확한 HTTPS origin allowlist와 제한된 인증 브리지 사용
- 시스템 안전 영역: `SafeAreaView`의 top·bottom 안에 전체 WebView 배치
- 기존 React Native fallback: `useBottomContentPadding`을 계속 적용

## 시스템 뒤로가기와 진입 스크롤

- 시스템 뒤로가기는 **한 번에 한 단계만** 돌아간다. 사진 확대, 중첩된 장소 검색,
  프로필 수정, 신고·확인 창, 알림·검색 팝오버, 사용자 메뉴 중 가장 위의 화면부터
  웹의 닫기/취소 버튼으로 닫는다. React가 소유한 DOM을 직접 제거하지 않는다.
- 모달이 열렸거나 저장 중인 동안 이전 페이지로 이동하지 않는다. 브리지 무응답·주입
  예외도 모달이 없다는 뜻으로 해석하지 않는다. 로딩 상태여도 현재 WebView에 확인한다.
- 선택한 검색 카테고리는 직전 선택부터 되돌린다. 작성·수정 폼에 변경 사항이 있으면
  시스템 Back과 다른 화면 링크 이동 전에 폐기 확인을 받고, 취소 시 입력을 유지한다.
- 위 단계가 없으면 기존 채팅방 → 채팅 목록 → 웹 방문 기록 → 루트 종료 안내 순서를 유지한다.
- `/trade/{id}`, `/trade/{id}/edit`, `/trade/new`, `/updates`와 마이페이지에서
  `/mypage/trades` 전체 보기 진입은 콘텐츠 렌더링 후 상단으로 이동한다.
  **목록으로 돌아올 때는 별도 정책**으로 방문 기록별 위치를 복원한다. 짧은 로딩 화면에
  브라우저 복원이 먼저 실행되어 위치가 0으로 제한되는 경우도 포함한다. 명시적인 URL
  해시와 필터별 방문 기록을 섞지 않는다.
- 목록 복원 정보는 현재 WebView 문서의 최근 60개 방문 기록에만 보관한다. 더보기로
  늘어난 목록은 기존 조회 버튼으로 복구하되 12초·추가 조회 최대 30회로 제한하고,
  오류·조회 무진행·사용자 조작 시 중단한다. 전체 문서 교체 복원은 별도 범위다.
- 네트워크 지연으로 콘텐츠가 늦게 나타나거나 사용자가 이미 스크롤을 시작한 경우,
  뒤늦은 보정으로 사용자 위치를 다시 이동시키지 않는지 확인한다.
- 갤러리·권한 화면에서 돌아오는 것은 앱 새 시작이 아니다. 동일 회원의 토큰 회전은
  열린 웹 문서를 재로딩하지 않아야 한다. 로그인·로그아웃·계정 전환은 별도로 처리한다.
- 파일 선택 취소와 편집창 취소는 별개다. `<input type="file">`의 `cancel`은 상위로
  전파되므로 React dialog의 `onCancel`이 부모 편집창까지 닫을 수 있다. Android 주입
  경계에서 dialog 내부 파일 입력의 `cancel`만 격리한다. 사진 `change`, 실제 dialog
  취소, X/취소 버튼, 이후 시스템 Back은 막지 않는다. 창을 다시 열거나 시간차로
  Back을 무시하는 방식으로 초안 소실을 숨기지 않는다.

실기기 DEV QA (3버튼과 제스처 모두):

- 목록 스크롤 → 상세 상단 → 사진 확대 → Back → 상세 유지 → Back → 목록 위치 유지
- 상세 하단 → 수정 상단 → 변경 후 Back → 계속 작성/나가기 → 상세 상단
- 프로필 수정 → 사진 선택/취소 → 편집창 유지 → 지역 검색 → Back → 편집창 → Back → 마이페이지
- 닉네임·지역·사진을 변경한 뒤 갤러리를 다시 열어 X/Back으로 취소 → 기존 초안과
  미리보기 유지 → 명시적 프로필 X/취소/Back은 정상 닫기
- 새 글 → 구매 매장/거래 장소 검색 → Back → 입력 유지 → Back → 폐기 확인
- 목록 스크롤 → + → 작성 화면 상단, 마이페이지 스크롤 → 내 교환글 전체 보기 → 목록 상단
- 더보기로 늘어난 목록 → 상세 → Back → 기존 카드 위치, 다른 검색 조건의 목록 왕복도 각각 복원
- 알림 팝오버·신고·확인·사용자 메뉴 닫기, 검색 카테고리 두 단계 복귀
- 업데이트 소식 최신 항목 상단, 채팅 사진 → 채팅방 → 목록 복귀

자동 검증은 `npm run web-shell:test`, Chromium 설치 환경의
`ANDROID_TEST_CHROME=<실행 파일> npm run web-shell:layout-test`로 실행한다.
실제 React 파일 선택 취소 재현에는 설치된 웹 React/ReactDOM/esbuild를 읽기 전용으로
사용한다. 별도 worktree에서는 `ANDROID_TEST_FRONTEND_NODE_MODULES=<기존 frontend/node_modules>`를
함께 지정한다. 테스트를 위해 frontend 소스나 의존성 파일을 수정하지 않는다.
브라우저 모의 테스트만으로 실제 Android Back·갤러리 동작을 검증했다고 판단하지 않는다.

개인정보처리방침은 웹의 새 창 링크를 같은 origin의 WebView 문서로 여는 기존 계약을
유지한다. SPA 목록 복원과 다른 문서 교체 왕복이므로, 별도 검증 없이 마이페이지의
위치를 강제 복원하거나 외부 브라우저로 이동 방식을 바꾸지 않는다.

인증 장시간 QA는 별도로 유지한다. 웹 요청과 네이티브 푸시 등록이 동시에 만료된 토큰을
갱신하는 경쟁은 이 변경의 해결 범위가 아니다. 동일 계정 갱신의 무재로딩과 초기
로그인·로그아웃·재시작 복원에 더해, 장시간 방치 후 푸시 수신도 실기기에서 확인한다.
