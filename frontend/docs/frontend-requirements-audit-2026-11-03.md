# 웹 프론트엔드 요구사항 충족도 감사

- 기준일: 2026-11-03
- 기준 브랜치: `origin/frontend-dev` (`95f40b8b`)
- 제외 범위: 렌더링 아키텍처 판단 및 페이지별 전략 수립
- 조사 범위: `frontend/`, 프론트엔드 GitHub Actions, 저장소 운영 문서, GitHub 브랜치 보호와 릴리스 메타데이터
- 조사하지 않은 범위: 백엔드 구현, 실제 PostHog/Sentry 프로젝트 화면, 실제 배포 서버의 Nginx와 CDN 설정

이 문서는 코드와 저장소 설정으로 확인한 스냅샷이다. 실제 사용자 환경의 성능, 접근성, 분석 이벤트 유입과 오류 알림은 운영 도구와 실기기에서 별도로 검증해야 한다.

## 판정 요약

| 요구사항                             | 판정                 | 핵심 근거와 남은 완료 조건                                                                                                                                                                                                                          |
| ------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webpack 기반 React & TypeScript 환경 | 충족                 | Webpack 5, React 19, TypeScript 6, 개발 서버와 프로덕션 빌드가 구성되어 있다. 2026-11-03 프로덕션 빌드가 성공했다.                                                                                                                                  |
| 사용자 행동 모니터링                 | 부분 충족            | PostHog 81개 명시 이벤트의 타입 선언과 호출이 일치하고 핵심·기능·품질 대시보드 동기화 코드가 있다. 운영 유입, 테스트 계정 제외, URL·리플레이 마스킹 확인이 남아 있다. 최근 이벤트 6개는 카탈로그 문서에서 누락됐다.                                 |
| 배포 자동화                          | 부분 충족            | `frontend-dev`와 `main` push 배포, contenthash, 원자적 Nginx 심볼릭 링크 교체가 있다. 두 브랜치 모두 GitHub branch protection이 없고, 배포 후 smoke/health check와 자동 롤백, 실제 캐시 헤더·CDN·AWS 증거가 없다.                                   |
| 테스트 전략과 자동화                 | 부분 충족            | Jest/RTL/MSW, Storybook, lint, format, typecheck, coverage, production build가 PR CI에 있다. 104 suites/450 tests가 통과하고 statement coverage는 79.23%다. E2E, 시각 회귀, 접근성 자동 검사, 수치 coverage gate가 없다.                            |
| 에러 트래킹                          | 부분 충족            | Sentry가 React 미처리 오류와 8개 핵심 처리 오류를 수집하며 개인정보 제거, route 정규화, release/environment, source map 업로드를 구현했다. 실제 DSN·알림·source map·Slack 검증 체크리스트는 완료 증거가 없고 일부 핵심 처리 오류가 조용히 유실된다. |
| development / production 분리        | 충족(운영 검증 필요) | 별도 workflow, runner, GitHub Environment, URL 변수, `APP_ENV`, 검색 엔진 색인 정책으로 분리된다. 실제 URL과 환경 변수의 현재 값은 저장소 밖이라 확인하지 않았다.                                                                                   |
| 시맨틱 버저닝                        | 부분 충족            | `frontend-v0.1.0`부터 `frontend-v1.13.0` 태그와 package `1.13.1`이 있다. GitHub Release는 `frontend-v1.11.0`에서 멈췄고 `v1.13.1` 태그·릴리스가 없으며 프론트 변경 이력과 명시적 롤백 절차도 없다.                                                  |
| TypeScript 기준과 런타임 안전성      | 부분 충족            | strict 계열 옵션과 PR typecheck, 주요 HTTP 응답 파서가 있다. 팀 사용 기준과 예외 근거 문서가 없고 채팅 REST/웹소켓 경계에는 제네릭 단언과 불완전한 런타임 검증이 남아 있다.                                                                         |
| 로딩 성능 개선                       | 미충족               | route lazy loading, contenthash, 이미지 lazy/eager 구분은 있다. 성능 관리 대상·예산·Lighthouse/field Web Vitals·before/after 리포트가 없고 현재 빌드는 크기 경고를 낸다.                                                                            |
| 렌더링 성능 개선                     | 미충족               | 일부 상태 계산 메모이제이션은 있으나 Profiler/Performance 측정, 핵심 인터랙션 기준, 병목 분석, before/after 리포트가 없다.                                                                                                                          |
| 웹 접근성 개선                       | 부분 충족            | 시맨틱 요소, 라벨, 포커스 스타일, 키보드 테스트가 여러 핵심 컴포넌트에 있다. skip link, 경로별 title, 자동 접근성 검사, 스크린리더 실사용과 before/after 영상·리포트가 없으며 구체적인 초점·대비 문제가 남아 있다.                                  |

## 모니터링과 오류 검증

### PostHog

확인된 강점:

- 81개 이벤트가 `AnalyticsEventPropertiesMap`과 실제 `captureAnalyticsEvent` 호출에 모두 존재한다.
- 검색, 지도·매장, 거래, 채팅, 신고·차단, 프로필, 탈퇴, 이벤트와 업데이트 흐름의 성공·실패를 명시적으로 수집한다.
- 공통 `environment`, `app_version`, schema version과 내부 사용자 여부를 붙인다.
- 회원 식별은 숫자 ID 기반 `member:{id}`만 사용하며 로그아웃 때 reset한다.
- URL의 OAuth/token 파라미터를 제거하고 모든 텍스트·입력값과 비공개 미디어를 세션 리플레이에서 마스킹하도록 구성했다.
- 대시보드를 코드로 동기화할 수 있고 핵심 지표, 기능 채택, 품질 대시보드를 분리했다.

확인된 공백:

1. `posthog-event-catalog.md`에 `notification_popover_opened`, `notification_selected`, `trade_filter_selected`, 채팅 이미지 선택·업로드·뷰어 이벤트 3개가 빠져 있다.
2. 대시보드 쿼리의 `filterTestAccounts`가 `false`이고 팀·테스트 계정 제외 코호트 생성 체크가 미완료다.
3. 운영 Live Events의 공통 속성, OAuth URL 제거, 세션 리플레이 마스킹 검증 증거가 없다.
4. 알림 목록/미읽음 수와 채팅 미읽음 수의 초기 로드 실패는 사용자에게 조용히 대체되며 결과 이벤트나 임계치 기반 오류 신호가 없다.
5. 모바일 지도 헤더 토글, 맨 위로 이동, 푸터 문의 링크 같은 보조 기능은 명시 이벤트가 없다. 개선 의사결정이 필요한 기능만 선택적으로 추가하고 모든 클릭을 수집하지 않는다.
6. Web Vitals의 명시 설정, 운영 대시보드, 예산과 알림이 없다. PostHog 원격 설정에서 자동 수집될 가능성만으로 활성 상태를 주장할 수 없다.

### Sentry

- 대상 환경: development와 production 모두 환경·release 분리를 지원한다. 실제 프로젝트 유입은 대시보드 확인이 필요하다.
- 수집 대상: React recoverable/uncaught/root boundary 오류와 OAuth callback, 검색·매장 응답 파싱, 채팅 재연결 소진, 거래 생성 5xx, 거래·채팅 이미지 압축, 채팅 이미지 업로드의 최종 실패다.
- 사용자 영향: 앱 전체 렌더 실패와 로그인, 탐색, 거래 작성, 채팅 연결·이미지 기능의 일부 치명적 실패를 재현하는 데 도움을 준다.
- 의도적 비수집: 예상 가능한 4xx, 사용자 입력 오류, 취소, 개별 네트워크 오류는 노이즈를 피하려고 수집하지 않는다. Replay, Performance, Profiles, Logs도 PostHog 중복·비용·개인정보를 이유로 사용하지 않는다.
- 개인정보: 요청 body/header/cookie/query, 스택 변수, 사용자 콘텐츠를 끄고 숫자 회원 ID와 템플릿화한 route만 허용한다.

추가가 필요한 신호:

1. 채팅 웹소켓 메시지와 방 갱신 JSON 파싱은 타입 단언 뒤 실패를 조용히 버린다. 세션당 임계치 기반의 고정 문맥 오류 1회 수집과 완전한 런타임 파서를 함께 적용한다.
2. 알림·채팅 미읽음 조회가 반복 실패할 때 배지 오류를 알 수 없다. 개별 요청이 아니라 반복/최종 실패만 warning으로 집계한다.
3. 거래 수정·상태 변경·삭제와 회원 탈퇴의 예상 밖 5xx 또는 응답 계약 오류는 PostHog outcome만 있고 원본 코드 위치를 찾는 제한된 Sentry 문맥이 없다. 사용자 오류를 제외하고 최종 서버/파싱 실패만 후보로 둔다.
4. Sentry의 development/production 분리, release, 원본 TypeScript stack, 개인정보 제거, Slack alert와 배포 후 재발 확인 체크리스트를 실제 프로젝트에서 완료해야 한다.

Sentry Performance를 성능 공백의 기본 해법으로 켜지 않는다. 현재 운영 정책을 유지하면서 PostHog Web Vitals 또는 별도 `web-vitals` RUM을 먼저 검토하고, Sentry 성능 추적은 비용·샘플링·개인정보 결정을 승인한 뒤 별도 작업으로 다룬다.

## 테스트와 타입 안전성

2026-11-03 실행 결과:

- Jest: 104 suites, 450 tests 통과
- Coverage: statements 79.23%, branches 75.79%, functions 72.89%, lines 79.23%
- Production Webpack build: 성공, 성능 경고 2개

우선 보강 대상:

- `useChatSocket.ts`는 coverage 0%이며 외부 웹소켓 프레임을 런타임 검증하지 않는다.
- 공용 지도 컴포넌트와 지도 훅 다수의 coverage가 0%다.
- 주요 경로를 잇는 Playwright 같은 E2E와 OAuth/지도 경계를 제어한 브라우저 통합 검사가 없다.
- Storybook은 빌드하지만 시각 회귀와 axe 계열 검사를 수행하지 않는다.
- coverage 보고서는 artifact로 남지만 병합 실패 기준이 없다.
- TypeScript의 `type`/`interface`, 외부 경계 검증 범위, 단언 허용 조건과 예외 근거를 정리한 팀 문서가 없다.

## 로딩 성능

프로덕션 빌드 측정:

| 항목                    |                    측정값 |
| ----------------------- | ------------------------: |
| 초기 entry JavaScript   |  450KB raw, 약 148KB gzip |
| 전체 JavaScript         | 1.31MB raw, 약 428KB gzip |
| PostHog 지연 청크       |   306KB raw, 약 96KB gzip |
| 랜딩 desktop search PNG |                     685KB |
| 랜딩 desktop trade PNG  |                     536KB |
| Gaegu 폰트 2개          |                     744KB |
| WebP encoder WASM 2개   |                     612KB |

Webpack 기본 경고는 초기 entry와 10개 대형 자산에 발생했다. 다음 순서로 측정하고 개선한다.

1. 핵심 경로를 랜딩, 거래 목록, 지도 검색, 채팅으로 정하고 모바일 중급 기기·느린 4G 조건의 baseline을 만든다.
2. 75번째 백분위 목표를 우선 LCP 2.5초 이하, INP 200ms 이하, CLS 0.1 이하로 두고 서비스별 FCP/TTFB와 JavaScript·이미지 예산을 확정한다.
3. PostHog Web Vitals 또는 별도 RUM으로 실제 운영 값을 수집하고 URL 식별자와 개인정보를 정규화한다.
4. Lighthouse CI와 Webpack 자산 예산을 PR gate로 추가한다.
5. 랜딩 PNG를 WebP/AVIF와 적정 크기로 변환하고 첫 스냅샷 우선순위를 검증한다.
6. Gaegu 폰트를 실제 사용 글리프/화면에 맞게 subset하거나 시스템 대체 전략을 검토한다.
7. `@sentry/react` 초기 비용과 PostHog 지연 로드 시점을 bundle analyzer로 분해한다. 관측 가능성을 훼손하지 않도록 측정 후 변경한다.
8. `HomePage`의 eager import를 route lazy loading 대상으로 전환할 가치가 있는지 초기 chunk 차이로 확인한다.

## 렌더링 성능

현재 병목으로 확정할 Profiler 증거는 없다. 다음은 측정 우선 후보이며, 측정 없이 `memo`나 가상화를 적용하지 않는다.

- 거래 목록의 `더보기`는 누적된 모든 카드를 다시 렌더링한다.
- 채팅 이전 기록은 메시지를 누적·정렬하고 전체 대화 DOM을 유지한다.
- 지도 결과는 지도 마커와 하단 카드 선택 상태가 함께 갱신된다.
- 전역 알림·채팅 미읽음 provider 갱신이 헤더와 하위 라우트에 미치는 범위를 확인할 필요가 있다.

React DevTools Profiler와 Chrome Performance에서 mount/update commit, 긴 작업, INP 후보 인터랙션을 기록한 뒤 상태 분리, 작업 분할, 메모이제이션, 리스트 가상화 중 필요한 수단만 선택한다. 개선 전후 동일한 데이터와 기기 조건을 리포트에 남긴다.

## 웹 접근성

확인된 강점:

- 문서 기본 언어가 `ko`다.
- `main`, `header`, `nav`, `footer`, `section`, `article`과 제목 요소를 여러 핵심 화면에서 사용한다.
- 입력 레이블, 버튼 이름, 상태·오류 role, 이미지 대체 텍스트 정책이 상당수 적용되어 있다.
- Testing Library role 기반 query가 536회이고 test id query는 10회다.
- 드롭다운, 헤더 팝오버, 장소 검색창 등 일부 복합 컴포넌트는 키보드와 Escape 동작을 테스트한다.
- 사진 뷰어는 초기 초점, focus trap, Escape와 opener focus 복원을 구현한다.
- 지도에는 확대/축소와 현재 위치 버튼, 매장 카드 목록이라는 제스처 대안이 있다.

확인된 문제와 위험:

1. 반복 헤더를 건너뛰는 skip link가 없다.
2. 모든 경로가 정적 `<title>가치가챠 | 가챠 매장 탐색과 교환</title>`을 공유한다.
3. 채팅 메시지 입력은 `outline: 0`이고 composer에 `:focus-within` 대체 표시가 없다. 숨긴 파일 입력도 보이는 label에 키보드 초점 표시가 없다.
4. 공용 `ConfirmDialog`는 초기 초점과 Escape는 있으나 focus trap, 배경 inert 처리, opener focus 복원이 없다. 신고 모달도 동일한 수동 검증이 필요하다.
5. `textSubtle` `#9a9395`의 흰 배경 대비는 약 3.01:1, 채팅의 `#aaa2a6`은 약 2.49:1로 일반 텍스트 4.5:1에 못 미친다. primary `#d93b54`와 흰색은 약 4.46:1이라 작은 일반 텍스트 조합을 재검토해야 한다.
6. 첫 진입 랜딩 투어는 `role="dialog"`와 `aria-modal`을 선언하지만 초기 초점, focus trap, 종료 후 초점 정책이 없다. 전체 화면 모달의 키보드·스크린리더 맥락을 실제로 검증해야 한다.
7. axe/Lighthouse 접근성 CI, 경로별 자동 검사, NVDA/VoiceOver/TalkBack 실사용 기록, before/after 영상과 정식 개선 리포트가 없다.
8. 큰 결과 영역 전체에 `aria-live="polite"`를 둔 거래 목록은 필터 시 과도한 낭독 가능성이 있어 짧은 결과 상태로 범위를 줄일지 실제 스크린리더로 확인해야 한다.

거래 사진 재정렬은 drag 외에 좌우 방향키 대안을 이미 제공한다. 이처럼 제스처를 유지하면서 동일 목적의 키보드 조작을 함께 제공하는 방식을 다른 복합 상호작용에도 재사용한다.

접근성 후속 작업은 `.agents/skills/gachigacha-web-accessibility`의 기준을 사용한다. 자동화 결과만으로 통과를 선언하지 않고 로그인, 검색·지도, 거래, 채팅, 프로필·탈퇴 핵심 과업을 데스크톱과 모바일 스크린리더로 완료한 증거를 남긴다.

## 권장 실행 순서

1. **P0 배포 게이트:** `frontend-dev`와 `main` branch protection, required `Frontend Quality`, 승인 규칙을 설정한다.
2. **P0 접근성 차단:** skip link와 route title, 채팅 composer focus, 공용 dialog focus lifecycle, 일반 텍스트 대비를 수정한다.
3. **P1 관측 운영 확인:** PostHog 테스트 계정 제외·마스킹·Live Events와 Sentry release/source map/개인정보/Slack alert를 실제 프로젝트에서 검증한다.
4. **P1 런타임 안전성:** 채팅 REST/웹소켓 파서와 테스트를 추가하고 반복 파싱 실패를 제한적으로 Sentry에 보낸다.
5. **P1 성능 baseline:** 모바일 핵심 경로의 Web Vitals와 Lighthouse/Profiler baseline, 예산, PR gate를 만든다.
6. **P1 브라우저 회귀:** 핵심 과업 E2E, axe, 시각 회귀를 도입하고 지도·웹소켓·OAuth는 제어 가능한 test double과 개발 서버 smoke로 나눈다.
7. **P2 릴리스 운영:** frontend release/changelog를 최신화하고 태그 기준 Nginx release rollback 절차를 문서화·연습한다.
