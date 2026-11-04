# 가치가챠 Sentry 최초 연결 런북

현재 프론트엔드에는 Sentry SDK, 최상위 Error Boundary, 개인정보 마스킹, Git SHA release, hidden source map 업로드가 이미 구현되어 있다. Sentry의 자동 설치 wizard나 agent plugin으로 코드를 다시 생성하지 않는다.

## 0. 고정 결정

- 범위: 가치가챠 웹 프론트엔드만
- 프로젝트: `gachi-gacha-frontend` 하나
- 환경 구분: `development`, `production`
- 조직 slug: `binggwa`
- 제품: Error Monitoring만 사용
- 제외: Replay, Performance/Tracing, Profiles, Logs
- 데이터: 미국 리전, 개인정보처리방침과 일치하는 최대 3개월 보유

프로젝트를 dev/prod로 두 개 만들지 않는다. 작은 팀에서는 한 프로젝트에서 environment와 release로 분리하는 편이 운영이 단순하며, Organization 사용량은 여러 프로젝트가 공유할 수 있어 프로젝트 분리가 quota 격리를 보장하지 않는다.

## 1. Sentry 프로젝트 생성

Sentry의 **Create a project** 화면에서 다음을 선택한다.

1. Platform: **React**
2. Products: **Error Monitoring**만 선택
3. Project name/slug: `gachi-gacha-frontend`
4. Team: `#binggwa`
5. Alert frequency: 우선 **High priority issues**
6. GitHub repository 연결: 최초 수집 확인 뒤 선택적으로 연결

화면의 **Set up with your coding agent**는 건너뛴다. 저장소 코드 연결은 이미 끝났고, 이 단계에서 필요한 것은 프로젝트·DSN·토큰 설정이다.

## 2. 서버 측 개인정보 보호 설정

Organization/Project Settings에서 가능한 범위로 다음을 활성화한다.

- 기본 data scrubbing
- 민감 필드 scrubbing
- IP 주소 저장 방지

추가 민감 필드에는 `authorization`, `cookie`, `password`, `secret`, `token`, `code`, `state`, `content`, `description`, `body`, `chat`, `inquiry`를 포함한다. 클라이언트의 `beforeSend` 마스킹과 서버 측 scrubbing을 함께 사용한다.

## 3. DSN 확인

Project Settings의 **Client Keys (DSN)** 에서 공개 DSN을 복사한다. DSN은 브라우저 번들에 포함되는 공개 수집 주소이고, source map 업로드 토큰과는 다른 값이다.

다음 값만 기록한다.

- Organization slug: `binggwa`
- Project slug: `gachi-gacha-frontend`
- DSN

## 4. source map 업로드 토큰 생성

Organization Settings의 **Developer Settings / Custom Integrations**에서 내부 integration을 만든다.

1. 이름: `gachigacha-frontend-source-maps`
2. 권한: CI와 source map release 작업에 필요한 `org:ci`만 부여
3. 생성된 organization token을 한 번 복사

토큰은 채팅이나 PR에 붙이지 않는다. 다음 단계에서 GitHub Secret 입력란에 직접 넣고 별도로 공유하지 않는다.

## 5. GitHub Environment 설정

Repository Settings → Environments에서 설정한다.

### `frontend-development`

Variables:

| 이름 | 값 |
| --- | --- |
| `SENTRY_ENABLED` | `true` |
| `SENTRY_DSN` | 3단계의 DSN |
| `SENTRY_ORG` | `binggwa` |
| `SENTRY_PROJECT` | `gachi-gacha-frontend` |

Secret:

| 이름 | 값 |
| --- | --- |
| `SENTRY_AUTH_TOKEN` | 4단계의 organization token |

### `frontend-production`

동일한 Variables와 Secret을 등록하되 development 검증이 끝날 때까지 `SENTRY_ENABLED=false`로 둔다. 두 환경의 DSN과 project slug는 같아도 되며, 앱이 보내는 `environment` 값과 Git SHA `release`로 구분한다.

## 6. development 배포 검증

1. `frontend-dev` 배포 workflow를 실행한다.
2. source map 업로드 실패가 warning인지 workflow 로그에서 확인한다.
3. 일회성 검증 브랜치에서만 의도적인 예외를 발생시킨다.
4. Sentry Issues에서 이벤트가 들어왔는지 확인한다.
5. 다음 항목을 확인한다.
   - environment가 `development`인가?
   - release가 배포 commit SHA인가?
   - stack trace가 minified bundle이 아니라 원본 TypeScript 파일·줄을 가리키는가?
   - route에는 query와 hash가 없는가?
   - 토큰·이메일·본문·header·body가 없는가?
   - 동일 원인의 이벤트가 같은 issue로 묶이는가?
6. 검증용 예외 코드는 커밋·병합 전에 제거한다.

검증에 실패하면 production을 켜지 않는다. DSN은 런타임 수집, auth token은 빌드 시 source map 업로드에 쓰이므로 각각 따로 진단한다.

## 7. production 활성화

development 검증이 모두 끝난 뒤에만 `frontend-production`의 `SENTRY_ENABLED`를 `true`로 바꾸고 운영 배포한다. 배포 직후 실제 사용자 오류를 강제로 만들지 말고, 초기 진입과 핵심 화면 smoke test 후 Sentry 수집 상태를 확인한다.

## 8. 첫 알림 구성

초기 규칙은 적게 시작한다.

1. production의 신규 `fatal`/critical 성격 issue
2. production에서 동일 issue가 10분 안에 5회 이상 발생

처음에는 Email로 연결하고, 팀 Slack 연동이 승인되면 전용 채널로 옮긴다. 모든 신규 warning을 실시간 알림으로 만들지 않는다.

## 9. 첫 1주 운영

- 매일 신규 issue와 rate-limited/dropped 이벤트를 확인한다.
- 노이즈 상위 issue는 바로 숨기지 말고 사용자 영향과 복구 흐름을 먼저 검토한다.
- 새 필터에는 조건·이유·담당·적용일·재검토일을 남긴다.
- 1주 뒤 실제 빈도를 기준으로 threshold를 조정한다.

## 사용자에게 받아야 하는 값

에이전트가 코드 검증을 진행하는 데 Sentry token 원문은 필요하지 않다. 사용자는 다음을 GitHub에 직접 설정하고 값 자체가 아니라 **설정 완료 여부**만 알려준다.

- Sentry project 생성 완료
- DSN을 두 GitHub Environment variable에 등록 완료
- `org:ci` token을 두 GitHub Environment secret에 등록 완료
- development deployment run URL
- Sentry에 수집된 검증 event URL 또는 민감 정보가 가려진 화면 캡처
