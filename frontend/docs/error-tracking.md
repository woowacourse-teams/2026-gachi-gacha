# 가치가챠 프론트엔드 오류 트래킹 운영 기준

PostHog는 이용 흐름·세션 리플레이, Sentry는 오류 스택·발생 환경·배포 릴리스를 담당한다. Sentry Replay와 성능 추적은 중복 수집과 비용을 피하기 위해 사용하지 않는다.

Sentry 관련 작업 전에는 저장소 스킬인 [`$gachigacha-sentry-operations`](../../.agents/skills/gachigacha-sentry-operations/SKILL.md)를 사용한다. 최초 계정·프로젝트 연결은 [설정 런북](../../.agents/skills/gachigacha-sentry-operations/references/setup-runbook.md), 이벤트 정보 고도화·필터링·알림·운영 판단은 [최적화 원칙](../../.agents/skills/gachigacha-sentry-operations/references/monitoring-policy.md)을 따른다.

## 수집 범위

- 미처리 JavaScript 오류와 Promise rejection
- React 19의 미처리·복구 가능 오류
- 최상위 Error Boundary에 도달한 렌더링 오류
- `development`/`production` 환경, Git commit SHA 릴리스, pathname
- 로그인한 경우 숫자형 내부 `memberId`
- 필요한 위치에서만 `captureHandledError`로 수집하는 핵심 기능의 예상 밖 실패

예상 가능한 입력 오류, 401 세션 만료, 안내된 4xx는 수집하지 않는다. 이름·닉네임·이메일·쿠키·요청 본문과 헤더·URL query/hash·OAuth code/state·access/refresh token·채팅/문의/게시글 본문도 수집하지 않는다.

## 개인정보 보호

SDK 기본 설정에서 PII, 쿠키, HTTP body/header, URL query, stack 변수 수집을 끈다. `beforeSend`와 `beforeBreadcrumb`에서 요청 데이터와 민감 키를 다시 제거하고 Bearer token·JWT를 마스킹한다. Sentry user context에는 숫자형 내부 회원 ID만 전송한다.

## GitHub Environment 설정

`frontend-development`, `frontend-production`에 각각 등록한다.

| 이름                | 종류     | 설명                               |
| ------------------- | -------- | ---------------------------------- |
| `SENTRY_ENABLED`    | Variable | `true`일 때 런타임 수집 활성화     |
| `SENTRY_DSN`        | Variable | React 프로젝트의 공개 DSN          |
| `SENTRY_ORG`        | Variable | organization slug (`binggwa`)      |
| `SENTRY_PROJECT`    | Variable | React project slug                 |
| `SENTRY_AUTH_TOKEN` | Secret   | source map 업로드용 최소 권한 토큰 |

릴리스는 workflow가 `${{ github.sha }}`를 자동 주입한다. PR 품질 검사는 `SENTRY_ENABLED=false`로 고정한다. 인증 토큰은 코드·로컬 `.env`·브라우저 번들에 넣지 않는다.

## Source map과 배포 가용성

모든 source map 자격값이 있는 production 빌드에만 `hidden-source-map`을 생성해 Sentry로 업로드한다. 업로드 실패는 경고로 남기되 서비스 배포는 계속한다. workflow는 성공·실패 여부와 관계없이 `dist`의 `.map`을 삭제해 Nginx에 공개하지 않는다.

## 심각도와 대응

| 등급 | 기준                         | 예시                        | 초기 대응           |
| ---- | ---------------------------- | --------------------------- | ------------------- |
| P0   | 전체 장애·보안/개인정보 위험 | 초기 렌더 실패, 토큰 노출   | 즉시 공유·롤백 검토 |
| P1   | 핵심 흐름이 다수에게 중단    | 로그인·검색·상세 진입 불가  | 1시간 내 분석 착수  |
| P2   | 일부 환경에서 반복되는 오류  | 특정 브라우저 DTO 파싱 실패 | 당일 트라이에이지   |
| P3   | 비핵심·재시도로 복구         | 일시적 요청 실패            | 주간 빈도 검토      |

Sentry 알림은 production 신규 fatal/critical과 동일 issue 10분 내 5회 이상을 기준으로 설정한다. development는 수동 확인 또는 일일 요약을 사용한다.

## 재현·디버깅 절차

1. environment, release, first/last seen, 횟수와 영향 사용자를 확인한다.
2. route, 브라우저·OS, 원본 TypeScript stack, breadcrumb를 확인한다.
3. 내부 member ID와 시각을 기준으로 PostHog 세션을 조회한다.
4. Sentry issue 링크·release·영향·재현 절차를 GitHub 이슈에 남긴다.
5. 가장 낮은 계층의 회귀 테스트를 추가하고 배포 후 재발 여부를 확인한다.

## 최초 연결 체크리스트

- [ ] Sentry에서 React 프로젝트 생성 및 DSN/project slug 확인
- [ ] 데이터 리전과 보유 기간이 개인정보처리방침(미국·최대 3개월)과 일치하는지 확인
- [ ] development Environment의 variables/secret 등록
- [ ] 일회성 개발 브랜치에서 테스트 오류 수집 확인 후 테스트 코드 제거
- [ ] 원본 TypeScript 스택, release, environment, route 확인
- [ ] 이벤트에 토큰·본문·이메일 등이 없는지 확인
- [ ] production Environment 설정과 알림 규칙 등록

고정된 오류 발생 버튼이나 라우트는 제품 코드에 남기지 않는다.
