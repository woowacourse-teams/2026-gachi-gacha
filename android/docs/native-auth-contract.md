# Android 네이티브 로그인 인계 계약

## 현재 웹 로그인과 다른 점

웹은 `GET /api/v1/oauth/{provider}`에서 로그인을 시작한 브라우저가 OAuth 콜백 뒤
`GET /api/v1/oauth/login/{provider}`까지 같은 세션 쿠키를 전달한다. Android의
네이티브 `fetch`와 시스템 브라우저는 쿠키 저장소를 공유하지 않으므로 웹 콜백을
앱이 바로 가로채서 같은 API를 호출하면 세션 검증에 실패할 수 있다.

다음 방식은 사용하지 않는다.

- access token 또는 refresh token을 딥링크 URL에 포함
- OAuth 화면 전체를 일반 WebView에 넣고 웹 저장소의 토큰을 추출
- refresh token을 AsyncStorage, 소스 코드, 로그에 저장

## 합의가 필요한 권장 계약

백엔드 구현은 백엔드 크루와 별도 이슈에서 합의하며 Android 저장소에서는 변경하지
않는다. 엔드포인트 이름은 예시이고, 아래 보안 속성이 계약의 핵심이다.

1. 앱이 provider, 환경별 callback scheme, PKCE challenge와 state를 포함해 로그인
   시작 API를 호출한다.
2. 시스템 브라우저에서 카카오 또는 네이버 로그인을 진행한다.
3. 서버가 provider callback을 처리하고 1회용 인계 코드만 다음 딥링크로 전달한다.
   - DEV: `gachigacha-dev://oauth/callback/{provider}`
   - PROD: `gachigacha://oauth/callback/{provider}`
4. 앱이 PKCE verifier와 인계 코드를 토큰 교환 API에 전달한다.
5. 서버는 코드를 즉시 폐기하고 기존 형식의 access/refresh token을 응답한다.
6. 앱은 두 토큰을 하나의 `expo-secure-store` 항목으로 저장한 뒤 내 정보를 조회한다.

인계 코드는 다음 조건을 만족해야 한다.

- 한 번만 사용 가능
- 수 분 이내 만료
- 환경, provider, state, PKCE 요청과 결합
- 서버 로그와 분석 도구에서 마스킹
- DEV/PROD callback scheme을 명시적으로 allowlist 처리

## Android에 준비된 범위

- 암호화 토큰 저장과 손상 세션 제거
- 앱 시작 시 access token으로 내 정보 조회
- access token 만료 시 refresh token 회전 및 재저장
- 동시 401에 대한 refresh 요청 중복 방지
- 인증 요청의 401 재시도와 최종 인증 만료 통지
- 로그아웃 시 로컬 토큰 우선 제거 후 서버 로그아웃 요청

로그인 버튼과 provider 딥링크 처리는 위의 1회용 인계 계약이 확정된 뒤 노출한다.
