# main v1.6.0 기준 Android 포팅 현황

기준은 운영 태그 `v1.6.0`의 `b10a283b`와 Android 통합 브랜치의
`b457fc9e`다. 이 문서는 2026-10-28 현재 병합된 #480, #482, #484, #489, #492와
완료된 #486과 진행 중인 #494를 반영한다. 코드 연결 완료와 실제 기기 QA 완료는 구분한다.

종료된 이벤트 응모, 웹에서도 준비 중인 관심 가챠·관심 매장은 포팅하지 않는다.
production 거래 feature flag는 로그인·신고·차단·Play 선언 검증과 사용자 승인 전까지
켜지 않는다.

## 현재 완료된 범위

### 공개 탐색

- 카테고리·키워드 가챠 탐색, 보유 매장 조회
- Kakao Maps 네이티브 지도, 캡슐 마커 선택, 카드 캐러셀과 2단계 상세 진입
- 매장 상세, 보유 가챠, 길찾기·전화·Instagram·공유
- 원격 이미지 fallback과 상세 이미지 확대
- G 로고와 wordmark, 로그인/프로필 중심 헤더와 드롭다운
- 교환 상세의 다른 교환글

### 인증 기반 UI

- SecureStore access/refresh token 저장과 세션 복구
- access token 갱신, 동시 401 refresh 단일화, 로그아웃
- 프로필 조회·닉네임·선호 지역·프로필 이미지 수정
- 내 교환글 요약·목록
- 차단 목록·해제
- 공개 회원 탈퇴 안내

소셜 로그인 시작은 아직 노출하지 않는다. 현재 서버 계약으로 시스템 브라우저에서
로그인한 뒤 서비스 토큰을 앱에 안전하게 넘길 방법이 없기 때문이다.

### 거래·안전

- development variant의 거래 목록·검색·상태 필터·상세·댓글
- 구매 매장과 거래 장소 표시
- 게시글·댓글·채팅 인접 신고/차단
- 차단 직후 신고 진입과 차단 사용자 콘텐츠 방어적 숨김
- 교환 상세에서 기존 방 조회 또는 첫 채팅방 생성
- #494에서 교환글 작성·수정·삭제·상태 변경과 네이티브 사진·장소 폼을 연결한다.

### 채팅·알림

- 채팅방 목록, 방 상세, 이전 메시지, STOMP 재연결
- 텍스트·복수 이미지 전송, 이미지 확대
- 읽음 처리와 전체 unread count
- 탈퇴/차단 회원 방어, 채팅 신고/차단
- 댓글 알림 목록·추가 로딩·개별/전체 읽음·교환글 이동

### 카탈로그와 운영 기반

- #486에서 웹과 byte 단위로 같은 generator와 revision을 사용하는 Android 정적
  쇼핑 커넥트 카탈로그를 연결한다.
- 검색 `/search`, 지도 `/map`, 교환 상세 `/trade`의 카테고리·제목 매칭,
  Asia/Seoul 노출 기간, 제휴 고지와 외부 브라우저 연결을 적용한다.
- Android Quality가 같은 Sheet를 검증해 변경 시 `android` 대상 PR을 만든다.
- DEV/PROD package·scheme·API, preview APK, Play AAB와 서명 설정은 유지 중이다.

## 남은 단계

### 1. Kakao·Naver 네이티브 OAuth 계약과 로그인

상태: **백엔드 계약 차단**

Android는 Apple 로그인을 제외하고 Kakao·Naver를 제공하는 방향이다. 다만 Apple로만
가입한 기존 회원의 접근 정책 또는 provider 계정 연결 정책은 서버·운영 합의가 필요하다.

시스템 브라우저와 native fetch는 웹 `HttpSession` 쿠키를 공유하지 않는다. 기존
JSON 토큰 응답만 되돌려도 브라우저가 JSON을 받고 앱은 읽을 수 없으므로 다음 중 한
형태의 브라우저→앱 인계와 앱의 HTTPS 교환 단계가 필요하다.

- DEV callback: `gachigacha-dev://oauth/callback/{provider}`
- PROD callback: `gachigacha://oauth/callback/{provider}`
- callback에는 짧은 TTL·일회용 code와 state만 전달
- 앱은 code와 PKCE verifier로 기존 `{ accessToken, refreshToken }` JSON을 교환
- access/refresh token은 URL, WebView, 로그와 분석 도구에 넣지 않음

별도 URL은 필수가 아니며 기존 endpoint에 mobile mode 또는 POST exchange를 추가할
수 있다. 그러나 브라우저 결과를 앱으로 돌려주고 서비스 토큰을 앱이 받는 단계 자체는
생략할 수 없다. 계약 확정 전 추측한 endpoint를 앱에 연결하지 않는다.

### 2. 교환글 작성·수정·삭제·상태 변경

상태: **#494 코드 포팅 완료, 실제 완료 QA는 로그인 필요**

- 웹 `v1.6.0`의 실제 request/response 계약을 기준으로 native form과 API를 구현
- 사진 선택, 형식·용량 검증, 미리보기, 삭제, 순서 변경
- 업로드 실패 시 거대한 원본을 자동 전송하지 않는 압축 정책
- 가지고 있는 것/얻고 싶은 것, 복수 거래 장소, 구매 매장, 가능 시간
- 작성 후 상세 복귀, 수정·삭제·상태 변경과 소유자 UI
- production feature flag는 계속 비활성

#494에서 development 앱에 연결했다. OAuth가 연결되면 실제 계정으로 multipart 업로드,
소유자 권한, 사진 순서와 장소 좌표를 검증해야 한다.

### 3. 인증 기능 실계정 연결과 계정 삭제

상태: **OAuth 이후**

- 로그인 후 원래 화면 복귀
- 프로필 수정·내 글·차단·신고의 실제 계정 회귀
- 앱 내부 회원 탈퇴
- Kakao·Naver 재인증 또는 탈퇴 인가 계약
- Apple 로그인 제외에 따른 기존 Apple 회원 정책 확인

### 4. 채팅 미디어 마감

상태: **기반 구현 완료, 일부 UX 미구현**

- 전송 전 이미지 미리보기·개별 취소
- 안전한 리사이즈/압축과 업로드 진행·재시도
- 전송 이미지 다운로드 또는 Android 공유 시트
- 키보드, background/foreground, 장시간 WebSocket 실기기 회귀
- 교환 상태 변경 UX가 채팅에 필요한지 웹과 재확인

### 5. FCM 푸시

상태: **Firebase 외부 설정 차단**

- DEV/PROD Firebase Android 앱과 각각의 `google-services.json`
- Android 13+ 알림 권한
- 로그인/복구/토큰 갱신 시 `PUT /api/v1/push-tokens`
- 로그아웃 전 `DELETE /api/v1/push-tokens`
- 댓글·채팅·공지 payload별 딥링크
- Firebase Admin private key는 앱과 workflow에 넣지 않음

REST 알림 센터는 완료됐지만 실제 push 수신은 이 단계에 남아 있다.

### 6. 공개 콘텐츠와 첫 사용 경험

상태: **Android만으로 진행 가능**

- 이용약관과 패치노트 allowlist WebView
- 버전이 있는 native onboarding seen flag
- 공개 계정 삭제와 정책 링크 회귀
- 쇼핑 커넥트 실기기 레이아웃·외부 링크 QA

### 7. 분석·오류 추적

상태: **운영 계약 필요**

- 모바일 PostHog 프로젝트, 이벤트 이름·중복 수집·개인정보 최소화
- Android Sentry 또는 Crashlytics 선택, DSN과 개인정보처리방침 반영
- OAuth URL·토큰·채팅 내용·이미지 URL을 원문 수집하지 않음

### 8. 접근성·성능·Play 운영 노출

상태: **마지막 통합 단계**

- Galaxy S24+ 3버튼/제스처, Pixel 8, 작은 화면, 큰 글자
- 지도 탭 복귀, background/foreground, 네트워크 지연·오류
- JPEG/PNG/WebP와 지원하지 않는 HEIF, 여러 장 업로드, 메모리 사용량
- UGC, 로그인, 계정 삭제, 알림, 분석 SDK에 맞는 Play Console 선언
- 신고 운영 경로와 심사용 로그인 절차 확인
- 사용자 승인 뒤 production 거래 feature flag 활성화

## 차단 항목

- Kakao·Naver 모바일 OAuth 일회성 인계·교환 계약
- Apple-only 기존 회원의 Android 접근 정책
- 앱 내부 계정 삭제 재인증 계약
- 신고 endpoint의 실제 운영자 수신 확인
- Firebase DEV/PROD Android 앱과 구성 파일
- PostHog·오류 추적 도구와 개인정보 정책

## 다음 작업 순서

1. #486 카탈로그를 검증·병합한다. (완료)
2. OAuth 계약 답변을 기다리는 동안 교환글 CRUD와 native 이미지 흐름을 포팅한다. (#494)
3. 로그인 계약이 도착하면 Kakao·Naver 로그인과 원래 화면 복귀를 가장 먼저 연결한다.
4. 실제 계정으로 신고·차단·프로필·내 글·채팅·알림을 통합 검증한다.
5. 채팅 미디어 마감과 FCM을 진행한다.
6. 약관·패치노트·온보딩을 연결한다.
7. 분석·오류 추적, 접근성·성능, Play 선언을 마친 뒤 운영 노출 승인을 받는다.
