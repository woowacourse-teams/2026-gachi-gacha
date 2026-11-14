# 가치가챠 Sentry 오류 수집·대응 설계

> 이 문서는 GitHub Wiki와 Notion에 그대로 옮겨 사용할 수 있는 운영 제출물이다. 구현 세부 설정은 [`error-tracking.md`](./error-tracking.md)를 함께 참고한다.

## 1. 도입 목적

배포 환경에서만 발생하는 오류는 개발자 환경에서 재현되지 않는 경우가 많다. 가치가챠는 Sentry를 사용해 **어떤 배포 버전에서, 어떤 화면과 실행 환경에서, 어떤 코드 경로가 실패했는지**를 확인하고 재현 단서를 확보한다.

Sentry가 오류 자체를 막아 주는 것은 아니다. 다만 다음 효과로 장애의 확산과 재발을 줄인다.

- 사용자 제보 전에 반복 오류를 발견한다.
- 영향을 받는 환경과 기능을 좁혀 원인 분석 시간을 줄인다.
- 원본 TypeScript 스택으로 실패 지점을 확인한다.
- 수정 배포 이후 같은 오류가 재발하는지 검증한다.
- 발생 빈도와 영향 범위를 기준으로 대응 우선순위를 정한다.

PostHog는 이용 흐름과 세션 분석, Sentry는 오류와 스택·배포 버전 분석을 담당한다. 중복 수집과 비용을 줄이기 위해 Sentry Replay, Performance, Profiles, Logs는 사용하지 않는다.

## 2. 수집 정보와 활용 목적

| 수집 정보                                    | 수집 이유                                              | 확인할 수 있는 내용                                                | 예방·대응에 사용하는 방법                                                              |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 오류 종류와 정제된 메시지                    | 같은 원인의 실패를 하나의 Issue로 묶기 위해            | 오류 유형, 최초·최근 발생 시각, 반복 횟수                          | 급증·재발을 감지하고 회귀 테스트 대상을 선정한다.                                      |
| JavaScript·React 스택                        | 실패한 코드 위치를 찾기 위해                           | 함수·컴포넌트 호출 흐름, 원본 TypeScript 파일과 줄                 | 추측 대신 실패 지점부터 분석하고 수정 범위를 줄인다.                                   |
| React 컴포넌트 스택                          | 렌더링 오류가 발생한 UI 경계를 찾기 위해               | 어떤 컴포넌트 트리에서 렌더링이 중단됐는지                         | 흰 화면 범위를 좁히고 적절한 Error Boundary를 설계한다.                                |
| `environment`                                | 개발과 운영 오류를 분리하기 위해                       | `development` 또는 `production`                                    | 개발 검증 오류가 운영 알림을 오염시키는 것을 막는다.                                   |
| `release`                                    | 오류가 유입된 배포를 찾기 위해                         | Git commit SHA 기반 배포 버전                                      | 이전 릴리스와 비교해 회귀 여부를 판단하고 롤백 대상을 정한다.                          |
| 템플릿화된 `route`                           | 실패한 사용자 흐름을 집계하기 위해                     | `/trade/:tradeId`, `/stores/:storeId`, `/chat/:roomId` 단위 발생량 | 특정 게시글 ID로 지표가 분산되는 것을 막고 장애 화면을 빠르게 찾는다.                  |
| 브라우저·OS·기기 종류                        | 환경 의존 오류를 식별하기 위해                         | Safari/Chrome, OS 버전, 데스크톱·모바일 분포                       | 특정 브라우저 이미지 처리 등 호환성 문제를 재현하고 지원 기준을 정한다.                |
| 발생 시각·횟수·영향 사용자 수                | 영향도와 긴급도를 판단하기 위해                        | 일시적 단건인지 다수 사용자에게 반복되는지                         | P0~P3 우선순위를 정하고 오류 급증 알림을 구성한다.                                     |
| 숫자형 내부 `memberId`                       | 동일 사용자의 반복 실패와 PostHog 세션을 연결하기 위해 | 개인을 직접 식별하지 않는 내부 번호 단위 영향                      | 해당 시각의 이용 흐름을 찾아 재현 단서를 보강한다. 이름·닉네임·이메일은 보내지 않는다. |
| 정제된 breadcrumb                            | 오류 직전의 기술적 동작 흐름을 확인하기 위해           | 화면 이동과 SDK가 남긴 안전한 이벤트 순서                          | 오류 직전 상태를 추론하되 URL query와 사용자 작성 내용은 제거한다.                     |
| `feature`, `operation`, `error.handled` 태그 | 화면이 복구해도 중요한 최종 실패를 기능별로 묶기 위해  | 인증·검색·지도·채팅·교환글·이미지 처리 중 어느 단계가 실패했는지   | 핵심 흐름별 실패율을 비교하고 담당 기능과 대응 순서를 정한다.                          |

## 3. 자동 수집하는 오류

- 처리되지 않은 JavaScript 오류
- 처리되지 않은 Promise rejection
- React 19의 미처리 오류와 복구 가능 렌더링 오류
- 최상위 Error Boundary까지 도달한 렌더링 오류

최상위 렌더링 오류가 발생하면 사용자는 흰 화면 대신 복구 안내와 새로고침 동작을 제공받는다.

## 4. 제한적으로 수집하는 핵심 기능 실패

예상 가능한 오류까지 모두 전송하면 일시적 네트워크 단절과 사용자 입력 오류가 실제 장애를 가린다. 따라서 아래 항목은 **재시도가 끝났거나 사용자에게 최종 실패가 표시되는 예상 밖 상황만** 고정된 메시지와 낮은 카디널리티 태그로 수집한다.

| 기능                    | 수집 조건                                            | 수집하지 않는 조건                                               | Sentry 태그                                        |
| ----------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| OAuth 콜백              | 토큰/응답 형식 오류 또는 서버 5xx로 콜백 완료 실패   | 사용자가 로그인을 취소한 경우, 안내된 4xx, 단순 오프라인         | `feature=auth`, `operation=oauth_callback`         |
| 가챠 검색 응답          | JSON 또는 DTO 형식이 계약과 달라 파싱 실패           | 백엔드가 정상 오류 코드로 응답한 경우, 요청 취소                 | `feature=search`, `operation=parse_gacha_response` |
| 지도 매장 응답          | 주변 매장 JSON 또는 DTO 형식 파싱 실패               | 결과 없음, 요청 취소, 안내된 API 오류                            | `feature=map`, `operation=parse_store_response`    |
| 채팅 연결               | 연결 성공 없이 WebSocket 종료가 3회 연속 발생        | 한두 번의 일시적 종료 후 재연결 성공, 화면 이탈에 따른 정상 종료 | `feature=chat`, `operation=socket_reconnect`       |
| 교환글 작성             | 작성 API가 5xx로 최종 실패                           | 입력 검증, 인증 만료, 413·기타 안내된 4xx                        | `feature=trade`, `operation=create_trade`          |
| 교환글·채팅 이미지 압축 | WebP 시도와 PNG 대체 처리까지 모두 실패              | WebP 실패 후 PNG로 정상 복구, 파일 크기·형식 검증 실패           | `operation=compress_image`                         |
| 채팅 이미지 업로드      | 서버 5xx 또는 성공 응답 형식·파일 개수가 계약과 다름 | 파일 개수·크기·형식 검증, 안내된 4xx                             | `feature=chat`, `operation=upload_image`           |

원본 오류에는 로컬 파일명, 서버 응답 본문, OAuth 정보가 섞일 수 있으므로 위 기능은 허용된 고정 오류 문구만 Sentry로 보낸다. 브라우저·OS·release·route 정보로 환경 차이를 분석한다.

## 5. 수집하지 않는 정보

| 제외 정보                                   | 제외 이유                                                       |
| ------------------------------------------- | --------------------------------------------------------------- |
| 이름, 닉네임, 이메일, 전화번호              | 오류 분석에 필요하지 않은 직접 식별 정보이기 때문               |
| access/refresh token, Authorization, Cookie | 계정 탈취로 이어질 수 있는 인증 정보이기 때문                   |
| OAuth `code`, `state`, URL query/hash       | 인증 정보와 검색어 등 민감 값이 포함될 수 있기 때문             |
| 요청·응답 body와 HTTP header                | 게시글·댓글·채팅·신고 상세 내용이 포함될 수 있기 때문           |
| 게시글·댓글·채팅·신고 본문                  | 사용자 생성 콘텐츠는 오류 위치 확인에 필요하지 않기 때문        |
| 이미지와 로컬 파일명                        | 개인 이미지와 기기 파일명이 개인정보가 될 수 있기 때문          |
| stack frame 지역 변수                       | 토큰과 사용자 입력이 메모리에 존재할 수 있기 때문               |
| 전체 IP 기반 개인정보와 기본 PII            | 최소 수집 원칙을 지키기 위해 SDK의 `sendDefaultPii`를 끄기 때문 |

SDK 설정에서 PII, Cookie, body/header, URL query, stack 변수 수집을 끈다. `beforeSend`와 `beforeBreadcrumb`에서 민감 키와 Bearer token·JWT를 한 번 더 제거한다.

## 6. 경로 태그 정규화

동적 식별자를 그대로 태그로 사용하면 `/trade/123`, `/trade/456`이 서로 다른 값이 되어 대시보드가 분산되고 Sentry 태그 카디널리티가 증가한다. 다음처럼 화면 단위 템플릿으로 정규화한다.

```text
/trade/123          → /trade/:tradeId
/trade/123/edit     → /trade/:tradeId/edit
/stores/42          → /stores/:storeId
/chat/7             → /chat/:roomId
/chat/start/31      → /chat/start/:tradeId
/oauth/login/apple  → /oauth/login/:provider
```

알 수 없는 신규 경로에서도 숫자와 UUID 세그먼트는 `:id`로 대체해 원문 식별자가 전송되지 않게 한다.

## 7. Source map과 릴리스 연결

브라우저용 코드는 압축되므로 source map이 없으면 Sentry 스택이 번들 파일의 난독화된 위치로 표시된다. CI는 다음 조건에서만 `hidden-source-map`을 생성해 Sentry에 업로드한다.

- Sentry 활성화
- Sentry organization/project 설정 존재
- source map 업로드용 인증 토큰 존재
- 운영 방식의 Webpack 빌드

업로드 후 배포 파일의 `.map`은 삭제해 공개 서버에 노출하지 않는다. Sentry에는 Git commit SHA를 `release`로 기록해 오류와 실제 배포 코드를 연결한다. source map 업로드 실패는 서비스 배포를 막지 않고 CI 경고로 남긴다.

## 8. 심각도와 초기 대응 기준

| 등급 | 기준                                          | 예시                            | 목표 대응                    |
| ---- | --------------------------------------------- | ------------------------------- | ---------------------------- |
| P0   | 전체 진입 불가, 보안·개인정보 위험            | 초기 렌더 실패, 토큰 노출       | 즉시 공유하고 롤백·차단 검토 |
| P1   | 로그인·검색·작성 등 핵심 기능이 다수에게 중단 | OAuth 전면 실패, 동일 오류 급증 | 1시간 내 분석 착수           |
| P2   | 일부 환경에서 반복되는 기능 오류              | 특정 Safari 이미지 압축 실패    | 당일 트라이에이지            |
| P3   | 비핵심이며 재시도로 복구 가능                 | 드문 일시 오류                  | 주간 빈도 검토               |

## 9. Slack 초기 알림 규칙

운영 환경만 `#frontend-sentry-alarm`으로 즉시 알리고 개발 환경은 수동 검증에 사용한다.

1. **신규·재발 핵심 오류**: `environment=production`, 새 Issue 또는 Regression, level이 `error` 이상
2. **반복 오류**: `environment=production`, 동일 Issue가 10분 동안 5회 이상 발생
3. **치명 오류**: `environment=production`, level이 `fatal`이면 첫 발생부터 알림

알림 본문에는 Issue 링크, environment, release, route, first/last seen, 발생 횟수를 확인한다. 사용자 작성 내용이나 토큰을 Slack에 복사하지 않는다.

### 9.1 Sentry에서 Slack 연결 확인

1. Sentry의 **Settings → Integrations → Slack**로 이동한다.
2. 연결한 Slack workspace가 `Active`인지 확인한다.
3. Slack의 `#frontend-sentry-alarm`에서 `/invite @Sentry`로 Sentry 앱을 초대한다.
4. 채널이 Sentry의 알림 대상 목록에 보이지 않으면 Slack integration을 다시 불러온다.

### 9.2 신규·재발 Issue 알림 만들기

Sentry의 **Monitors → New Monitor**는 오류 알림 수신자를 설정하는 화면이 아니다. 이 화면 하단의 **Create an issue alert** 링크를 선택하거나 **Monitors → Alerts**로 이동한다.

1. 프로젝트를 가치가챠 프론트엔드 프로젝트로 선택한다.
2. 이름을 `PROD 신규·재발 프론트 오류`로 입력한다.
3. 환경은 `production`으로 제한한다.
4. 조건은 `A new issue is created` 또는 `A resolved issue changes to unresolved` 중 하나가 충족될 때로 설정한다.
5. 필터가 제공되면 `level`이 `error` 또는 `fatal`인 이벤트만 포함한다.
6. Action에서 **Send a Slack notification**을 선택한다.
7. workspace와 `#frontend-sentry-alarm`을 선택하고 규칙을 저장한다.

### 9.3 반복 오류 알림 만들기

1. 이름을 `PROD 반복 프론트 오류`로 입력한다.
2. 환경은 `production`으로 제한한다.
3. 동일 Issue가 **10분 동안 5회 이상** 발생할 때로 설정한다.
4. Action은 동일하게 `#frontend-sentry-alarm` Slack 알림을 선택한다.
5. 알림 반복 간격은 처음에는 30분으로 두고, 실제 발생량을 본 뒤 조정한다.

### 9.4 개발 환경에서 알림 검증

운영 수집이 비활성화된 동안에는 운영 규칙을 테스트할 수 없다. 다음 순서로 개발 환경에서 한 번만 검증한다.

1. `environment=development`인 임시 Issue Alert를 만든다.
2. Slack Action 옆에 **Send test notification** 또는 **Test**가 제공되면 이를 사용한다.
3. 테스트 버튼이 없으면 개발 서버에서 개인정보가 없는 의도적 오류를 한 번 발생시켜 Issue와 Slack 수신을 확인한다.
4. Issue에서 `environment`, `release`, 원본 TypeScript 스택, 템플릿화된 `route`를 확인한다.
5. 검증 후 임시 규칙과 의도적 오류 코드를 제거한다.

Sentry UI 명칭은 변경될 수 있다. Slack은 규칙 기반 알림을 특정 채널로 전송할 수 있으며, 현재 Alert API도 환경·Issue 발생 조건·빈도 조건·Slack Action을 각각 지원한다.

## 10. 장애 재현과 수정 흐름

1. Slack 알림에서 Sentry Issue를 연다.
2. `environment`, `release`, `route`, first/last seen과 발생 횟수를 확인한다.
3. 브라우저·OS 분포와 원본 TypeScript 스택을 확인한다.
4. 숫자형 member ID와 시각을 기준으로 PostHog 이용 흐름을 확인한다.
5. 영향을 받는 기능·사용자 범위로 P0~P3를 정한다.
6. 가장 낮은 계층에 회귀 테스트를 추가하고 수정한다.
7. 개발 환경에서 재현과 source map 복원을 검증한다.
8. 운영 배포 후 같은 release 이후 재발 여부를 확인하고 Issue를 해결 처리한다.

## 11. 운영 점검 체크리스트

- [ ] 개발·운영 이벤트가 `environment`로 분리되는가?
- [ ] 오류에 올바른 Git SHA `release`가 표시되는가?
- [ ] 스택이 원본 TypeScript 파일과 줄로 복원되는가?
- [ ] route에 실제 게시글·매장·채팅 ID가 남지 않는가?
- [ ] 이벤트와 breadcrumb에 token, query/hash, body, 이메일, 사용자 콘텐츠가 없는가?
- [ ] 예상 가능한 4xx와 사용자 입력 오류가 수집되지 않는가?
- [ ] Slack 알림이 운영 환경 규칙에만 전송되는가?
- [ ] 수정 배포 이후 같은 오류의 재발 여부를 확인했는가?

## 12. 참고 자료

- [Sentry Slack integration 정보](https://docs.sentry.io/api/integrations/get-integration-provider-information/)
- [Sentry Alert 조건과 Slack Action](https://docs.sentry.io/api/monitors/create-an-alert-for-an-organization/)
- [Sentry organization integration 조회](https://docs.sentry.io/api/integrations/list-an-organizations-available-integrations/)
