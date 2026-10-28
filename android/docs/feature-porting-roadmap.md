# main v1.6.0 기준 Android 기능 포팅 현황

이 문서는 운영 서비스 태그 `v1.6.0`의 실제 커밋 `b10a283b`와 Android 통합
브랜치 기준 커밋 `ef286c80`을 비교한 결과다. `origin/main`의 이후 health-check
hotfix는 Android 사용자 기능 기준선에 포함하지 않는다.

상태는 다음 의미로 사용한다.

- **완료**: Android 코드에 기능이 연결되어 있다. 실기기 검증 여부는 별도로 적는다.
- **기반 완료**: 도메인·저장소·공통 UI는 있으나 사용자가 끝까지 완료할 흐름은 없다.
- **개발 앱 완료**: development variant에서만 노출되며 production에는 숨겨져 있다.
- **미구현**: Android 사용자 흐름이 없다.
- **차단**: Android 코드만으로 확정할 수 없는 서버·운영 계약이 필요하다.

종료된 이벤트 응모와 웹에서도 준비 중인 관심 가챠·관심 매장은 신규 앱 범위에서
제외한다.

## 기능 매트릭스

### 공개 탐색

| v1.6.0 기능 | Android 상태 | 운영 노출 | 다음 조건 |
| --- | --- | --- | --- |
| 주요 카테고리별 가챠 탐색 | #477 구현 완료 | 검색 탭 | 실제 기기 QA |
| 가챠 키워드 검색 | 완료 | 노출 | 검색 회귀 QA |
| 선택 가챠 보유 매장 조회 | 완료 | 노출 | 네트워크 실패 회귀 QA |
| 홍대 지도·캡슐 마커·매장 카드 | 완료 | 노출 | Galaxy S24+ 생명주기 회귀 QA |
| 매장 상세·보유 가챠 | 완료 | 노출 | 깨진 이미지와 느린 응답 QA |
| 길찾기·전화·Instagram·공유 | 완료 | 노출 | 실제 설치 앱 연결 QA |
| 이미지 fallback·전체 화면 보기 | 완료 | 노출 | JPEG/PNG/깨진 URL QA |

### 거래

| v1.6.0 기능 | Android 상태 | 운영 노출 | 다음 조건 |
| --- | --- | --- | --- |
| 거래 목록·검색·상태 필터·추가 로딩 | 개발 앱 완료 | production 숨김 | 로그인·신고·차단 운영 검증 |
| 공개 거래 상세 | 개발 앱 완료 | production 숨김 | 동일 |
| 가지고 있는 것·얻고 싶은 것 | 개발 앱 완료 | production 숨김 | 웹 용어·실데이터 회귀 QA |
| 구매 매장·거래 장소 표시 | 개발 앱 완료 | production 숨김 | 주소 앱 연결 회귀 QA |
| 댓글 조회·비회원 댓글 작성 | 개발 앱 완료 | production 숨김 | 신고 endpoint 운영 검증 |
| 글 작성·수정 | 미구현 | 미노출 | 로그인과 네이티브 이미지 흐름 |
| 글 삭제·상태 변경 | 미구현 | 미노출 | 로그인 연결 |
| 이미지 선택·압축·추가·삭제·순서 변경 | 미구현 | 미노출 | 네이티브 picker/압축 정책 구현 |
| 본인 글 전체보기 | 미구현 | 미노출 | 로그인 연결 |

### 인증과 마이페이지

| v1.6.0 기능 | Android 상태 | 운영 노출 | 다음 조건 |
| --- | --- | --- | --- |
| SecureStore 세션 저장·복구 | 기반 완료 | 내부 연결 | OAuth 일회성 인계 |
| access token 갱신·동시 401 단일화 | 기반 완료 | 내부 연결 | 실제 계정 만료 회귀 QA |
| 로그아웃 | 기반 완료 | 인증 세션에서만 | OAuth 로그인 연결 |
| 카카오·네이버·Apple 로그인 | 차단 | 미노출 | 모바일 OAuth handoff 계약 |
| 로그인 후 원래 화면 복귀 | 미구현 | 미노출 | 딥링크·handoff 계약 |
| 프로필 조회 | 기반 완료 | 인증 세션에서만 | OAuth 로그인 연결 |
| 닉네임·프로필 이미지 수정 | 미구현 | 미노출 | 로그인과 이미지 업로드 |
| 내 교환글 | 미구현 | 미노출 | 로그인 연결 |
| 차단 목록·차단 해제 | 개발 앱 완료 | 인증 세션에서만 | 실제 계정 QA |
| 앱 내부 회원 탈퇴 | 차단 | 미노출 | 특히 Apple 재인증 handoff 계약 |
| 공개 회원 탈퇴 안내 | 완료 | 노출 | 외부 브라우저 회귀 QA |

### 채팅·안전·알림

| v1.6.0 기능 | Android 상태 | 운영 노출 | 다음 조건 |
| --- | --- | --- | --- |
| 채팅 목록·채팅방 | 미구현 | 미노출 | 로그인 연결, REST/WebSocket 포팅 |
| 첫 메시지와 함께 채팅방 생성 | 미구현 | 미노출 | v1.6.0 계약 기반 구현 |
| 텍스트·읽음 상태 | 미구현 | 미노출 | WebSocket 생명주기 구현 |
| 이미지 선택·압축·미리보기·전송·취소 | 미구현 | 미노출 | 네이티브 이미지 기반 |
| 전송 이미지 확대·다운로드 | 미구현 | 미노출 | 저장소 권한·공유 정책 |
| 탈퇴 회원·차단 회원 처리 | 미구현 | 미노출 | 채팅 UI 구현 후 회귀 QA |
| 게시글·댓글 인접 신고·차단 | 개발 앱 완료 | production 숨김 | 실제 신고 endpoint와 계정 QA |
| 차단 직후 신고 진입 | 개발 앱 완료 | production 숨김 | 동일 |
| 차단 콘텐츠 방어적 숨김 | 개발 앱 완료 | production 숨김 | 목록·상세 실데이터 QA |
| 알림 목록·읽음 처리 | 미구현 | 미노출 | 로그인 연결 |
| FCM 토큰 등록·삭제 | 미구현 | 미노출 | 환경별 Firebase 앱 설정 |
| Android 13+ 권한·푸시 딥링크 | 미구현 | 미노출 | Firebase 설정과 실기기 QA |

v1.6.0에서 확인한 푸시 토큰 계약은 인증된 `PUT /api/v1/push-tokens`와
`DELETE /api/v1/push-tokens`다. 등록 body는
`{ "token": "...", "platform": "ANDROID" }`, 삭제 body는
`{ "token": "..." }`다. 푸시 data는 댓글 알림의 `type`, `notificationId`,
`tradeId`, `commentId`와 채팅 알림의 `type=CHAT`, `roomId`가 정의되어 있다.

### 공개 콘텐츠와 운영 기반

| v1.6.0 기능 | Android 상태 | 운영 노출 | 다음 조건 |
| --- | --- | --- | --- |
| 개인정보처리방침 | 선택적 WebView 파일럿 완료 | 노출 | 뒤로가기·외부 링크 실기기 QA |
| 이용약관 | 미구현 | 미노출 | 공개 allowlist 경로 확인 |
| 패치노트 | 미구현 | 미노출 | 공개 allowlist 경로 확인 |
| 랜딩·온보딩 | 미구현 | 미노출 | 버전이 있는 native seen flag |
| 네이버 쇼핑 커넥트 | 미구현 | 미노출 | Android 데이터 공급 방식 결정 |
| PostHog 이벤트 | 미구현 | 미노출 | 모바일 프로젝트·이벤트 계약 |
| 비정상 종료 추적 | 미구현 | 미노출 | 도구·DSN·개인정보 문구 결정 |
| DEV/PROD 설정·preview APK·운영 AAB | 완료 | CI | 서명과 versionCode 유지 |

## origin/android에서 이미 완료된 범위

- React Native 셸, 네이티브 헤더·탭, safe area와 루트 double-back 종료
- DEV/PROD 앱 이름·package·scheme·API 분리
- 공개 검색, 지도, 매장 상세, 이미지 fallback, 공유·길찾기·전화·Instagram
- 개발 앱의 거래 목록·필터·상세·댓글
- SecureStore 세션, 토큰 갱신, 동시 401 단일화와 로그아웃 기반
- 게시글·댓글 신고, 사용자 차단, 차단 직후 신고, 차단 목록·해제 기반
- 계정/프로필 진입과 공개 회원 탈퇴 안내
- 등록 feature와 allowlist만 허용하는 공개 WebView 기반
- Kakao Maps 네이티브 모듈과 화면 이탈·복귀 생명주기 보정
- EXIF release runtime 의존성, Android 품질·preview·Play AAB workflow

## 백엔드·외부 계약으로 차단된 범위

### Android 네이티브 OAuth handoff 요청

- **필요한 기능**: 카카오·네이버·Apple 시스템 브라우저 로그인, 원래 화면 복귀,
  Apple 회원 탈퇴 재인증
- **현재 확인한 계약**: 브라우저에서 `GET /api/v1/oauth/{provider}`로 시작하고
  `GET|POST /api/v1/oauth/login/{provider}`가 `HttpSession` nonce를 소비한다. v1.6.0
  서버는 서비스 access/refresh token을 웹 callback fragment로 전달한다.
- **부족하거나 모호한 계약**: native fetch와 브라우저가 세션 쿠키를 공유하지 않으며,
  Android callback scheme, PKCE, 단일 사용 handoff code와 교환 API가 없다.
- **필요한 HTTP method와 경로**: 서버 팀이 최종 경로를 확정해야 한다. 요청안은
  브라우저용 `GET /api/v1/oauth/mobile/{provider}` 시작점과 native fetch용
  `POST /api/v1/oauth/mobile/{provider}/exchange` 교환점이며, Apple 탈퇴에도 같은
  단일 사용 인계가 필요하다. 이 경로는 합의 전 Android 코드에서 호출하지 않는다.
- **request/response 요구**: 시작 요청은 allowlist된 callback URI, PKCE S256
  challenge, state를 서버 요청과 결합한다. 앱 callback에는 짧은 TTL의 handoff code만
  전달하고, 교환 요청은 handoff code와 PKCE verifier를 보내 기존
  `{ accessToken, refreshToken }` 응답을 받는다.
- **인증 및 오류 코드**: 취소, state 불일치, 만료, 재사용, provider 불일치와 callback
  불일치를 구분해야 하며 교환 성공 즉시 코드를 폐기한다.
- **딥링크·보안 요구사항**: DEV `gachigacha-dev://oauth/callback/{provider}`, PROD
  `gachigacha://oauth/callback/{provider}`만 허용한다. 서비스 토큰은 URL, 로그,
  분석 이벤트, WebView와 AsyncStorage에 남기지 않는다.
- **없을 때 막히는 Android 범위**: 로그인 UI 노출, 인증 거래·마이페이지·채팅·알림,
  앱 내부 회원 탈퇴와 실제 계정 신고·차단 QA

### 운영 설정이 필요한 항목

- `ANDROID_MEMBER_REPORT_ENDPOINT` 실제 제출과 운영자 확인 경로
- Firebase DEV/PROD Android 앱과 환경별 `google-services.json`
- 모바일 PostHog 프로젝트와 이벤트 정책
- Android 오류 추적 도구, DSN과 개인정보처리방침 반영
- 제휴 카탈로그의 공통 정적 JSON/asset 또는 안전한 공개 화면 결정

Firebase Admin 서비스 계정 JSON과 private key는 Android 앱이나 workflow에 넣지 않는다.

## Android만으로 바로 진행할 수 있는 범위

1. 카테고리 가챠 탐색과 검색·지도 연결 (#477)
2. 이용약관·패치노트 등 로그인 없는 공개 읽기 화면
3. 버전이 있는 native 온보딩 seen flag와 첫 사용자 흐름
4. production flag를 켜지 않은 거래 작성·수정 UI와 네이티브 이미지 기반
5. 인증 화면과 분리 가능한 채팅 표시·키보드·이미지 컴포넌트 기반
6. 알림 API 파서와 화면 기반. FCM 수신은 Firebase 설정 뒤 연결
7. 접근성, 큰 글자, 작은 화면, 네트워크 실패와 생명주기 회귀 보강

## Play Console 선언 변경이 필요한 범위

다음 기능을 production에 노출하기 전 Play Console의 심사 정보와 데이터 보안 선언을
함께 갱신한다.

- 소셜 로그인: 심사용 계정 또는 검토 가능한 로그인 절차
- 거래·댓글·채팅: 사용자 생성 콘텐츠, 신고·차단과 운영자 처리 경로
- 회원 탈퇴: 앱 내부 진입과 공개 계정 삭제 URL
- FCM: 알림 권한 목적과 수집·전송 데이터
- PostHog·오류 추적: 수집 SDK, 이벤트·진단 데이터와 개인정보처리방침
- 이미지 선택·업로드: 사진 접근 방식과 보관·삭제 정책

보관 기간이나 서버 처리처럼 확인되지 않은 값은 추측해 입력하지 않는다.

## 구현 우선순위

1. 네이티브 OAuth handoff 계약 합의와 로그인 연결
2. 로그인 기반 신고·차단 실제 계정 검증
3. 교환글 작성·수정·삭제·상태 변경과 이미지 흐름
4. 마이페이지 내 글·프로필 수정·회원 탈퇴
5. 채팅과 이미지 전송
6. 알림 센터·FCM·푸시 딥링크
7. 약관·패치노트·제휴 카탈로그 등 공개 읽기 콘텐츠
8. 온보딩, PostHog와 비정상 종료 추적
9. 전체 접근성·성능·Play 운영 노출

OAuth 계약이 확정되기 전에는 위 순서를 기다리며 멈추지 않고, 각 단계에서 인증과
무관한 가장 높은 우선순위의 공개 기능을 진행한다. production 거래 feature flag는
로그인·신고·차단·Play 선언을 검증하고 사용자 승인을 받은 뒤에만 켠다.
