# 가치가챠 프론트엔드 오류 트래킹 운영 기준

이 문서는 배포된 프론트엔드에서 발생한 예상하지 못한 오류를 Sentry로 확인하고, 사용자의 민감 정보를 최소화하며, 팀이 동일한 기준으로 재현·대응하기 위한 기준이다. PostHog는 이용 흐름과 세션 리플레이, Sentry는 오류 스택·배포 릴리스·발생 환경의 연결을 각각 담당한다.

## 1. 수집 범위

### 자동 수집

- 최상위 React Error Boundary에 도달한 렌더링 오류
- React 19 루트의 미처리 오류와 복구 가능한 오류
- Sentry 브라우저 SDK의 기본 통합으로 감지하는 미처리 JavaScript 오류와 Promise rejection
- 오류 직전의 페이지 이동·네트워크 breadcrumb
- `development`/`production` 환경, Git commit SHA 릴리스, 현재 pathname
- 로그인 후 JWT에서 검증한 숫자형 내부 `memberId`

Error Boundary와 React 루트의 `onCaughtError`를 동시에 연결하면 동일 오류가 중복 수집될 수 있어, 현재는 Error Boundary가 caught error를 담당하고 React 루트에는 uncaught/recoverable error만 연결한다. Sentry가 비활성화된 환경에서는 React의 기본 오류 핸들러를 교체하지 않는다.

### 의도적으로 제외한 범위

- Sentry Session Replay와 performance tracing은 사용하지 않는다. 세션 리플레이와 행동 분석은 PostHog에서 확인한다.
- API의 모든 4xx/5xx를 일괄 수집하지 않는다. 입력 검증 실패, 401 세션 만료, 사용자에게 안내된 404처럼 예상 가능한 실패는 이벤트 잡음으로 만들지 않는다.
- 이름, 닉네임, 이메일, access/refresh token, OAuth `code`/`state`, 쿠키, request body/header/query, 채팅·문의·교환글 본문은 수집하지 않는다.

예상하고 `catch`한 오류 중에서도 핵심 기능을 막는 5xx, 응답 계약 파싱 실패, 반복되는 네트워크 실패는 `captureHandledError(error, { feature, operation, level })`로 필요한 위치에만 추가한다. 기능별 연결 PR에는 “사용자가 예상한 실패인가, 팀이 즉시 알아야 하는 실패인가”를 기록한다.

## 2. 데이터 보호 정책

SDK의 기본 설정과 `beforeSend`/`beforeBreadcrumb` 정제를 두 겹으로 적용한다.

1. SDK 설정에서 쿠키, HTTP body/header, URL query, GraphQL 문서·변수, stack frame 변수, 자동 user information 수집을 끄다.
2. 전송 직전에 request body/header/cookie/query를 제거하고 URL은 pathname만 남긴다.
3. 이벤트·breadcrumb에 남은 Bearer token, JWT, OAuth 민감 query, token·password·content·chat 등의 키를 필터링한다.
4. Sentry user context에는 내부 `memberId`만 보낸다. 비로그인 상태와 로그아웃 후에는 즉시 제거한다.
5. 새 컨텍스트를 추가할 때는 민감 정보 정제 테스트를 함께 추가한다.

현재 개인정보처리방침은 Sentry 오류 정보의 미국 전송과 최대 3개월 보유를 기준으로 작성했다. 운영 전에 Sentry 프로젝트의 데이터 리전과 retention을 이 기준에 맞게 설정해야 하며, 다른 정책을 선택하면 방침도 함께 수정한다.

## 3. 환경 설정

GitHub의 `frontend-development`, `frontend-production` Environment에 각각 아래 값을 등록한다.

| 이름                | 종류               | 용도                                                                    |
| ------------------- | ------------------ | ----------------------------------------------------------------------- |
| `SENTRY_ENABLED`    | Variable           | `true`일 때만 런타임 수집과 source map 업로드를 활성화                  |
| `SENTRY_DSN`        | Variable           | 브라우저 SDK가 사용하는 공개 project DSN                                |
| `SENTRY_ORG`        | Variable           | Sentry organization slug                                                |
| `SENTRY_PROJECT`    | Variable           | 환경별 Sentry project slug                                              |
| `SENTRY_AUTH_TOKEN` | **Secret**         | 배포 시 source map 업로드 권한. Repository·로컬 `.env`·번들에 넣지 않음 |
| `SENTRY_RELEASE`    | workflow 자동 주입 | GitHub `sha`. 직접 등록하지 않음                                        |

DSN은 브라우저 번들에 포함되는 공개 연결 정보이지만, auth token은 소스 맵 업로드 권한을 가진 비밀 정보다. `SENTRY_ENABLED=true`인데 DSN이 없거나, source map용 세 값 중 일부만 있으면 빌드를 실패시켜 오설정을 배포 전에 드러낸다.

PR의 `Frontend Quality` 빌드는 `SENTRY_ENABLED=false`로 고정한다. 테스트·Storybook·PR 빌드가 실제 Sentry 프로젝트에 이벤트나 source map을 전송하지 않는다.

## 4. 릴리스와 source map

- 개발·운영 배포는 GitHub commit SHA를 동일한 Sentry release 이름으로 사용한다.
- production mode 중 `SENTRY_ENABLED=true`이고 org/project/auth token이 모두 있을 때만 `hidden-source-map`을 생성한다.
- 빌드 종료 전 Sentry에 source map을 업로드하고 `dist` 안의 `.map`을 삭제한다. Nginx에는 소스 맵이 배포되지 않는다.
- 업로드 인증 정보가 없으면 source map 자체를 생성하지 않는다.
- Sentry 업로드 실패는 현재 빌드·배포를 실패시킨다. 해석할 수 없는 오류를 배포하지 않는다는 정책이며, 배포 가용성을 더 우선하기로 팀이 합의하면 plugin의 error handling 정책을 별도로 변경한다.

## 5. 심각도와 대응 기준

| 등급          | 기준                                             | 예시                             | 초기 대응                             |
| ------------- | ------------------------------------------------ | -------------------------------- | ------------------------------------- |
| P0 / Critical | 전체 서비스 이용 불가, 보안·개인정보 노출 가능성 | 초기 렌더링 전면 실패, 토큰 노출 | 즉시 공유, 필요 시 롤백·수집 비활성화 |
| P1 / Fatal    | 상당수 사용자의 핵심 흐름 중단                   | 로그인·검색·상세 진입 불가       | 1시간 이내 분석 착수                  |
| P2 / Error    | 일부 환경·사용자에게 반복되는 복구 가능 오류     | 특정 매장 DTO 파싱 실패          | 당일 트라이에이지                     |
| P3 / Warning  | 핵심 흐름을 막지 않는 일시적 실패                | 재시도로 회복된 요청             | 주간 잡음·빈도 검토                   |

최상위 Error Boundary는 `fatal`, 선택적으로 수집하는 처리된 오류는 성격에 따라 `error` 또는 `warning`을 사용한다. 심각도는 코드의 클래스명이 아니라 사용자 영향과 발생 빈도로 최종 판단한다.

## 6. 알림과 트라이에이지

Sentry에서 다음 알림 규칙을 팀 공용 채널로 연결한다.

1. production에서 새로운 fatal/critical issue가 처음 발생한 경우 즉시 알림
2. production 동일 issue가 10분 안에 5회 이상 발생한 경우 알림
3. development 환경은 실시간 호출 대신 일일 요약 또는 수동 확인

이슈를 확인할 때는 아래 순서를 따른다.

1. `environment`, `release`, first/last seen, 발생 횟수와 영향 사용자 수를 확인한다.
2. route, 브라우저·OS, stack trace, breadcrumb를 확인한다.
3. `memberId`가 있으면 같은 식별자와 시간대로 PostHog 세션을 조회한다. 두 도구에 이름·닉네임을 추가하지 않는다.
4. 같은 release의 소스 맵 스택으로 원본 코드 위치를 확인한다.
5. 사용자 영향·재현 절차·Sentry issue 링크·release를 GitHub 이슈에 남긴다.
6. 수정 시 가장 낮은 계층의 회귀 테스트를 추가하고, 배포 후 같은 이슈가 재발하지 않는지 확인한다.

## 7. 최초 설정·배포 체크리스트

- [ ] Sentry organization과 **React** project를 생성하고 팀원을 초대한다.
- [ ] 개인정보처리방침과 맞게 미국 데이터 리전, 최대 3개월 retention을 확인한다.
- [ ] `frontend-development`와 `frontend-production` Environment에 variable/secret을 각각 등록한다. 개발·운영 project를 분리하거나 최소한 environment filter를 고정한다.
- [ ] source map 업로드용 auth token에는 release/project 업로드에 필요한 최소 권한만 부여한다.
- [ ] `frontend-dev`에 배포한 뒤 개발 project에 environment/release/route가 보이는지 확인한다.
- [ ] 일회성 개발 패치에서 `captureHandledError(new Error('Sentry smoke test'), { feature: 'monitoring', operation: 'smoke_test', level: 'warning' })`를 호출해 이벤트와 원본 스택을 확인하고 **즉시 제거**한다.
- [ ] 로그인·비로그인 이벤트에서 user context와 민감 정보 정제가 의도대로인지 확인한다.
- [ ] production 알림 수신 채널과 담당자를 정한 뒤 알림 규칙을 등록한다.
- [ ] 전용 개인정보 문의 이메일을 확정하고 사용자에게 노출하는 방침을 최종 검수한다.

smoke test는 고정된 디버그 라울트나 버튼으로 남기지 않는다. 프론트 코드 병합과 별개로 Sentry 프로젝트·GitHub Environment·알림 채널 수동 설정이 끝나야 실제 수집이 시작된다.
