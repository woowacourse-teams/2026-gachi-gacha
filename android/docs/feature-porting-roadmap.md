# Android WebView 하이브리드 포팅 현황

> 제품 UI와 사용자 반응 경로의 기준은 작업 시점 최신 웹 `main`의 모바일
> 반응형 뷰다. Android는 웹 화면을 임의로 다시 디자인하지 않고, OS 권한·OAuth·
> 안전한 토큰 저장·푸시·외부 앱 연결처럼 앱에서만 처리할 수 있는 기능을 담당한다.

2026-10-30 기준 `android` 브랜치와 DEV APK 실기기 QA 결과를 기록한다. 코드 연결,
외부 환경 설정, 실기기 검증은 서로 다른 완료 조건으로 구분한다.

## 현재 구조

- 기본 화면은 최신 웹 모바일 화면을 단일 WebView에서 제공한다.
- Kakao·Naver OAuth는 시스템 브라우저와 검증된 Android App Link를 사용한다.
- access/refresh token은 Android SecureStore에 저장하고 웹 세션과 브리지로 동기화한다.
- 위치 권한, Android 시스템 안전 영역, 외부 링크, FCM 토큰과 푸시 딥링크는
  Android가 처리한다.
- 과거 네이티브 화면은 비상용 fallback으로만 유지하며 새 제품 UI의 기준으로 삼지
  않는다.

세부 책임과 보안 경계는 [webview-hybrid-architecture.md](./webview-hybrid-architecture.md),
모바일 화면 포팅 규칙은 [web-mobile-parity.md](./web-mobile-parity.md)를 따른다.

## 완료된 범위

### 공개 탐색과 거래

- 거래/교환, 지도, 검색과 상세 화면의 웹 모바일 UI
- Kakao 지도, 캡슐·카드 포커스, 검색 결과와 현재 위치 권한
- 가챠·매장 검색, 쇼핑 커넥트 정적 카탈로그와 외부 링크
- 교환글 작성·수정·삭제·상태 변경, 댓글, 신고·차단
- 프로필, 선호 거래 지역, 내 교환글과 알림 화면

### 인증과 세션

- Kakao·Naver 네이티브 OAuth 코드와 PKCE/nonce 계약
- HTTPS callback App Link와 SecureStore 세션 복구
- 로그인 후 원래 웹 화면 복귀, refresh token 회전과 로그아웃 동기화
- Apple 로그인은 Android 로그인 화면에서 제외

Kakao 로그인은 DEV 실기기에서 왕복을 확인했다. Naver 로그인은 동일 코드 경계를
사용하지만 별도 실기기 최종 확인이 남아 있다.

### 채팅과 알림

- 채팅방 목록·상세, 텍스트·이미지 전송, 읽음 처리와 재연결
- 댓글 알림 목록·개별/전체 읽음과 대상 교환글 이동
- Android 13 이상 알림 권한과 댓글·채팅 알림 채널
- 로그인·토큰 갱신·로그아웃에 맞춘 FCM token 등록·해제
- 댓글은 교환글, 채팅은 채팅방으로만 이동하는 숫자 경로 allowlist

DEV Firebase Android 앱, CI 설정 주입과 백엔드 Firebase Admin 설정을 연결했고,
DEV APK 실기기에서 댓글·채팅 푸시 수신을 확인했다. 알림을 눌렀을 때의 대상 화면
이동은 1.0.0 최종 회귀 항목으로 유지한다.

### 빌드와 운영 기반

- 개발 `com.dev.gachigacha.app`, 운영 `com.gachigacha.app` 분리
- DEV/PROD API·OAuth callback·Firebase 설정 분리
- Android Quality preview APK와 서명된 Play AAB workflow
- 웹과 같은 generator/revision을 사용하는 쇼핑 커넥트 정적 카탈로그
- 토큰, OAuth URL, 서비스 계정 키를 앱 로그와 저장소에 남기지 않는 검증

## 남은 단계

### 1. 인증·계정 실기기 회귀

상태: **일부 실기기 QA 남음**

- Naver 로그인과 로그인 전 화면 복귀
- 앱 재시작·장시간 백그라운드 뒤 세션 복구와 401 refresh
- 웹 로그아웃·회원 탈퇴 뒤 SecureStore와 FCM token이 함께 정리되는지 확인
- Apple로만 가입한 기존 회원의 Android 접근 정책 확인

### 2. 채팅 미디어와 장시간 사용 마감

상태: **기본 전송 완료, Android UX 회귀 남음**

- 이미지 선택 전 미리보기·개별 취소가 웹과 같은지 확인
- 큰 JPEG/PNG/WebP의 업로드 실패·재시도와 메모리 사용량 확인
- 채팅 이미지 저장 또는 Android 공유 시트 연결 여부 결정
- 키보드, 화면 회전, background/foreground, 장시간 WebSocket 회귀

### 3. 공개 문서·외부 링크 회귀

상태: **코드 연결 완료, 운영 URL QA 남음**

- 개인정보처리방침·업데이트 소식·계정 삭제 안내 URL 확인
- 네이버 쇼핑 커넥트, 길찾기, 전화, Instagram이 허용된 외부 앱으로 열리는지 확인
- 존재하지 않는 이용약관 경로를 앱에서 노출하지 않도록 웹 운영 경로와 합의

### 4. 접근성·성능·Play 1.0.0

상태: **다음 통합 단계**

- Galaxy 3버튼/제스처, Pixel, 작은 화면, 큰 글자와 TalkBack
- 지도·채팅 탭 복귀, 느린 네트워크·오프라인·서버 오류 복구
- UGC 신고·차단, 로그인, 계정 삭제, 알림에 맞는 Play Console 선언
- Play App Signing 인증서의 App Link와 Kakao Maps hash 등록
- 내부 테스트 AAB 후 비공개 테스트와 운영 1.0.0 승인

실행 순서는 [release-qa-checklist.md](./release-qa-checklist.md)와
[play-closed-test.md](./play-closed-test.md)를 따른다.

### 5. 분석·오류 추적

상태: **운영 계약 필요**

- PostHog 이벤트 이름·웹 중복 수집·개인정보 최소화 합의
- Android Sentry 또는 Crashlytics 선택과 개인정보처리방침 반영
- OAuth URL·토큰·채팅 내용·이미지 URL 원문을 수집하지 않는 필터

## 외부 합의가 필요한 항목

- Apple 전용 기존 회원의 Android 로그인 정책
- 회원 탈퇴 재인증 계약과 실제 탈퇴 회귀
- 신고를 실제로 검토·조치하는 운영 경로
- 이용약관의 운영 URL과 동의 시점
- 분석·오류 추적 도구와 개인정보 정책

## 다음 작업 순서

1. Naver 로그인, 앱 재시작 세션, 로그아웃·회원 탈퇴를 실계정으로 확인한다.
2. 채팅 이미지·키보드·백그라운드 복귀를 장시간 실기기 QA한다.
3. 운영 URL과 외부 앱 연결을 확인한다.
4. 기기·접근성·네트워크 회귀를 마친 뒤 1.0.0 AAB를 내부 테스트에 올린다.
5. Play 선언과 심사용 계정을 확정해 비공개 테스트를 시작한다.
