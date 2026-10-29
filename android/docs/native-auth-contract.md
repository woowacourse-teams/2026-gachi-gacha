# Android 네이티브 로그인 인계 계약

## 현재 웹 로그인과 다른 점

웹은 `GET /api/v1/oauth/{provider}`에서 로그인을 시작한 브라우저가 OAuth 콜백 뒤
`GET /api/v1/oauth/login/{provider}`까지 같은 세션 쿠키를 전달한다. Android의
네이티브 `fetch`와 시스템 브라우저는 쿠키 저장소를 공유하지 않으므로 웹 콜백을
앱이 바로 가로채서 같은 API를 호출하면 세션 검증에 실패할 수 있다.

Android 앱은 `kakao | naver`만 제공한다. Apple로만 가입한 기존 회원의 Android 접근
정책은 서버·운영 합의가 끝날 때까지 별도 과제로 둔다.

다음 방식은 사용하지 않는다.

- access token 또는 refresh token을 딥링크 URL에 포함
- OAuth 화면 전체를 일반 WebView에 넣고 웹 저장소의 토큰을 추출
- refresh token을 AsyncStorage, 소스 코드, 로그에 저장

## Android에 준비된 모바일 계약

백엔드 구현은 백엔드 크루와 별도 이슈에서 합의하며 Android 저장소에서는 변경하지
않는다. Android는 현재 제안된 다음 계약을 한 경계에 격리해 두었으며, 실제 서버
request/response 이름이 달라지면 해당 API 모듈만 조정한다.

1. 앱이 `GET /api/v1/oauth/mobile/nonce/{provider}`로 짧게 만료되는 nonce를 받는다.
2. 앱이 매 요청마다 PKCE verifier와 S256 challenge를 생성하고 verifier는
   `expo-secure-store`에 임시 저장한다.
3. 시스템 브라우저에서 provider 인가 URL을 연다. 서버 nonce를 `state`와 OIDC
   `nonce`에 함께 넣고, challenge와 환경별 HTTPS callback을 전달한다.
4. provider가 HTTPS callback으로 `code`와 `state`를 돌려주면 Android App Link가 앱을
   연다.
5. 앱이 callback의 HTTPS origin, path, provider, state를 모두 대조한다.
6. 앱이 `POST /api/v1/oauth/mobile/login/{provider}`에 `code`, `nonce`, `codeVerifier`를
   보내고 기존 형식의 access/refresh token을 받는다.
7. 앱은 두 토큰을 하나의 `expo-secure-store` 항목으로 저장한 뒤 내 정보를 조회한다.

OAuth client ID는 공개 식별자라 빌드 설정으로 전달할 수 있지만 client secret은 서버에만
둔다. provider access/refresh token을 앱의 가치가챠 access/refresh token으로 취급하지
않으며, 가치가챠 토큰은 반드시 서버의 HTTPS 교환 응답으로만 받는다.

nonce와 provider 인가 코드는 다음 조건을 만족해야 한다.

- 한 번만 사용 가능
- 수 분 이내 만료
- 환경, provider, state, PKCE 요청과 결합
- 서버 로그와 분석 도구에서 마스킹
- DEV/PROD HTTPS callback을 명시적으로 allowlist 처리

## HTTPS와 Android App Link

Android 앱이 별도의 HTTPS 서버나 인증서를 가지는 것은 아니다. API 요청과 OAuth
callback 모두 기존 공개 도메인의 Nginx/TLS 인증서를 사용한다. callback URL은 다음
빌드 변수로 주입하며 값이 없으면 로그인과 App Link를 활성화하지 않는다.

```text
ANDROID_OAUTH_CALLBACK_BASE_URL_DEV
ANDROID_OAUTH_CALLBACK_BASE_URL_PROD
ANDROID_KAKAO_OAUTH_CLIENT_ID_DEV
ANDROID_KAKAO_OAUTH_CLIENT_ID_PROD
ANDROID_NAVER_OAUTH_CLIENT_ID_DEV
ANDROID_NAVER_OAUTH_CLIENT_ID_PROD
```

callback base는 `https://`만 허용하고 포트, query, fragment, 사용자 정보가 포함된 URL은
빌드 설정 검증에서 거부한다. 실제 provider별 callback은 `{base}/kakao`와
`{base}/naver`다.

App Link를 검증하려면 callback host의 `/.well-known/assetlinks.json`에 환경별 package와
서명 인증서 SHA-256 fingerprint를 배포해야 한다. 개발 preview는 CI APK 인증서,
운영은 Play App Signing 인증서를 사용한다. provider 콘솔의 callback, 서버의 모바일
redirect URI, Android 빌드 변수는 완전히 같은 URL이어야 한다.

Apple 회원 탈퇴는 제공자 토큰 폐기를 위한 재인증이 필요하다. 기존 웹의
`GET /api/v1/oauth/withdraw-url`과 `DELETE /api/v1/members/me?code=...` 흐름도
브라우저 세션에 의존하므로, 앱에서는 로그인과 같은 1회용 인계 방식으로 탈퇴용
인가 코드를 전달하는 계약을 함께 확정해야 한다.

## Android에 준비된 범위

- 암호화 토큰 저장과 손상 세션 제거
- 앱 시작 시 access token으로 내 정보 조회
- access token 만료 시 refresh token 회전 및 재저장
- 동시 401에 대한 refresh 요청 중복 방지
- 인증 요청의 401 재시도와 최종 인증 만료 통지
- 로그아웃 시 로컬 토큰 우선 제거 후 서버 로그아웃 요청
- 웹과 같은 카카오·네이버 로그인 화면
- 시스템 브라우저 OAuth와 PKCE S256 생성
- nonce/verifier의 SecureStore 임시 저장과 만료 제거
- HTTPS callback origin/path/state 검증
- 모바일 nonce·토큰 교환 API 경계
- 로그인 성공 후 기존 인증 세션 저장과 이전 화면 복귀

callback과 client ID 설정이 없는 빌드는 로그인 화면을 안내 상태로 유지하고 provider
버튼을 비활성화한다. 따라서 서버·provider·도메인 설정이 확정되기 전에도 현재 공개
탐색 기능에는 영향을 주지 않는다.

## 백엔드 `feature/495-social-login` 확인 결과

2026-10-29 원격 커밋 `abff3843` 기준으로 Android가 사용하는 공개 계약은 다음과 같다.

| 구분 | 계약 |
| --- | --- |
| nonce | `GET /api/v1/oauth/mobile/nonce/{provider}` |
| 토큰 교환 | `POST /api/v1/oauth/mobile/login/{provider}` |
| 교환 요청 | `code`, `nonce`, `codeVerifier` JSON |
| 교환 응답 | `BaseResponse<LoginResponse>`의 `data.accessToken`, `data.refreshToken` |
| provider | 소문자 `kakao`, `naver`도 서버 converter가 허용 |

Android API 경계는 이 경로와 필드에 맞춰져 있다. 다만 해당 커밋에는 컨트롤러와
서비스가 참조하는 다음 신규 소스가 포함되어 있지 않아 현재 브랜치 그대로는 컴파일할
수 없다.

- `MobileNonceInfo`
- `MobileLoginRequest`
- `MobileNonceResponse`
- `MobileOauthNonce`
- `MobileOauthNonceHasher`
- `MobileOauthNonceJpaRepository`

또한 운영 설정이 Flyway를 사용하므로 모바일 nonce 테이블과 필요한 unique/expiry
인덱스를 만드는 migration도 필요하다. 백엔드 브랜치에 위 소스와 migration이 포함되고
DEV 서버에 배포된 뒤 실제 OAuth 왕복을 검증한다.

## 서버·provider·Android가 맞춰야 할 값

| 값 | 서버 | Android | provider 콘솔 |
| --- | --- | --- | --- |
| Kakao client ID | `KAKAO_MOBILE_CLIENT_ID` | `ANDROID_KAKAO_OAUTH_CLIENT_ID_*` | 같은 앱의 REST client ID |
| Naver client ID | `NAVER_MOBILE_CLIENT_ID` | `ANDROID_NAVER_OAUTH_CLIENT_ID_*` | 같은 앱의 client ID |
| Kakao callback | `KAKAO_MOBILE_REDIRECT_URL` | callback base + `/kakao` | 완전히 같은 URL |
| Naver callback | `NAVER_MOBILE_REDIRECT_URL` | callback base + `/naver` | 완전히 같은 URL |

`KAKAO_MOBILE_CLIENT_SECRET`, `NAVER_MOBILE_CLIENT_SECRET`처럼 provider token 교환에 필요한
secret은 서버에만 둔다. Android Repository Variable에는 공개 client ID와 callback만
넣는다. DEV와 PROD는 package, client, callback, 서명 인증서를 서로 섞지 않는다.
