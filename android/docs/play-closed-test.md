# Google Play 내부·비공개 테스트 출시 가이드

> 마지막 점검: 2026-11-02

현재 운영 빌드는 단순 지도 앱이 아니다. 지도·가챠 검색뿐 아니라 카카오/네이버 로그인, 거래글과 댓글, 채팅, 알림, 신고·차단, 프로필과 계정 삭제까지 포함한 전체 서비스를 WebView와 Android 네이티브 기능이 함께 제공한다. Play Console 응답과 심사용 안내도 이 실제 동작을 기준으로 작성한다.

## 현재 제출 범위

- 로그인 없이 지도, 매장, 가챠 검색과 상세 정보 탐색
- 카카오·네이버 소셜 로그인과 프로필 관리
- 거래글 작성, 사진 업로드, 댓글, 신고와 차단
- 거래 상대와의 채팅 및 이미지 전송
- 새 댓글·채팅 Android 푸시 알림
- 선택적인 현재 위치 사용
- 네이버 쇼핑 커넥트 제휴 상품 카탈로그
- 앱 안의 회원 탈퇴와 공개 웹 계정 삭제 경로

## 고정 값

| 항목 | 값 |
| --- | --- |
| 운영 package | `com.gachigacha.app` |
| 개발 package | `com.dev.gachigacha.app` |
| 운영 웹/API origin | `https://gachigacha.kro.kr` |
| 내부 테스트 기본 버전 | `0.1.0` / versionCode `1` |
| 정식 출시 예시 | `1.0.0` / 이전보다 큰 versionCode |
| target/compile SDK | API 36 |
| 개인정보처리방침 | `https://gachigacha.kro.kr/privacy` |
| 외부 계정 삭제 경로 | `https://gachigacha.kro.kr/account-deletion` |

Play Console에 첫 AAB를 올린 뒤 package는 변경할 수 없다. 이후에는 같은 package와 서명을 유지하고 업로드할 때마다 versionCode를 증가시킨다.

## 역할 구분

### Android 저장소에서 준비된 것

- DEV/PROD package와 origin 분리
- 환경별 Firebase 설정 주입과 FCM 토큰 등록·해제
- 소셜 로그인 App Link와 네이티브 OAuth 연결
- 운영 AAB 서명 및 검증 workflow
- 위치와 알림 런타임 권한
- Play 아이콘과 feature graphic

### Play Console 담당자가 할 일

- 앱 생성, 스토어 등록정보와 App content 설문 작성
- 심사용 재사용 가능 로그인 계정과 접근 절차 입력
- 내부·비공개 테스터 명단과 트랙 운영
- Play App Signing 인증서 확인
- Data safety, 광고, 콘텐츠 등급 응답 최종 확정

### Nginx 담당자가 할 일

- 운영 도메인의 `/.well-known/assetlinks.json`에 Play **App signing certificate** SHA-256 반영
- 개인정보처리방침과 계정 삭제 URL이 로그인 없이 열리는지 확인

### 백엔드 담당자가 할 일

- 운영 OAuth callback과 모바일 client 설정
- 운영 Firebase Admin 서비스 계정 및 `FCM_PUSH_ENABLED=true` 확인
- 회원 탈퇴 트랜잭션과 관련 데이터 삭제가 실제 완료되는지 확인
- Data safety의 보관 기간, 제3자 제공·처리 여부 확정

## 출시 전 차단 항목

다음 항목이 실패하면 내부 테스트는 가능하지만 프로덕션 심사 제출 완료로 간주하지 않는다.

- 앱과 `https://gachigacha.kro.kr/account-deletion` 양쪽에서 회원 탈퇴가 완료된다.
- 로그아웃·회원 탈퇴 후 해당 사용자의 FCM 토큰이 더 이상 활성 상태가 아니다.
- 앱 종료 상태에서 댓글과 채팅 푸시가 도착하고, 누르면 올바른 화면으로 이동한다.
- 카카오·네이버 로그인, 앱 재실행 로그인 유지, 로그아웃이 정상 동작한다.
- 거래글·댓글·채팅의 신고와 사용자 차단 경로가 동작한다.
- 개인정보처리방침이 실제 수집 항목과 일치한다.

현재 회원 탈퇴 서버 트랜잭션 수정은 백엔드 배포 후 실기기에서 최종 검증해야 한다.

## 1. Play Console 앱 생성

1. Play Console에서 새 앱을 만든다.
2. 앱 이름 `가치가챠`, 기본 언어 한국어, 앱, 무료를 선택한다.
3. Play App Signing을 사용한다.
4. `Android Play Release`가 만든 운영 AAB를 내부 테스트 트랙에 처음 올린다.
5. 첫 AAB의 package가 `com.gachigacha.app`인지 반드시 확인한다.

## 2. Upload key와 GitHub 설정

Play App Signing에서 upload key는 팀이 AAB를 업로드할 때 쓰며, 실제 사용자에게 배포되는 app signing key와는 다르다.

upload key가 없다면 안전한 로컬 환경에서 한 번만 생성한다.

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore gachigacha-upload.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

GitHub Actions Secrets:

```text
ANDROID_KAKAO_MAP_NATIVE_APP_KEY_PROD
ANDROID_GOOGLE_SERVICES_JSON_PROD_BASE64
ANDROID_UPLOAD_KEYSTORE_BASE64
ANDROID_UPLOAD_KEYSTORE_PASSWORD
ANDROID_UPLOAD_KEY_ALIAS
ANDROID_UPLOAD_KEY_PASSWORD
```

GitHub Actions Variables:

```text
ANDROID_OAUTH_CALLBACK_BASE_URL_PROD
ANDROID_KAKAO_OAUTH_CLIENT_ID_PROD
ANDROID_NAVER_OAUTH_CLIENT_ID_PROD
```

keystore, 비밀번호, Firebase 설정 원문은 저장소·이슈·PR에 올리지 않는다. 팀 비밀 저장소에 복구 가능하게 보관한다.

## 3. 운영 AAB 생성

GitHub Actions에서 `Android Play Release`를 수동 실행한다.

- `version_name`: 사용자에게 보이는 버전. 내부 테스트 예: `0.1.0`
- `version_code`: Play 업로드마다 증가하는 양의 정수. 첫 제출 예: `1`

workflow는 운영 package와 origin으로 clean prebuild하고, Firebase 설정과 upload key를 주입한 뒤, 서명된 `app-release.aab`와 검증 결과를 artifact/Summary로 제공한다. 일반 `Android Quality`의 APK는 실기기 QA용이며 Play 제출 파일이 아니다.

## 4. Play App Signing 연결

Play Console의 **설정 > 앱 무결성(App integrity)** 에서 App signing certificate의 SHA-256을 확인한다.

이 값으로 다음 두 곳을 갱신한다.

1. 운영 Nginx의 `https://gachigacha.kro.kr/.well-known/assetlinks.json`
2. Kakao Developers의 운영 Android 플랫폼 키 해시

upload certificate의 SHA-256만 등록하면 Play가 다시 서명한 앱에서 App Link 또는 Kakao 인증이 실패할 수 있다. 실제 배포본에는 app signing certificate를 사용한다.

## 5. 내부 테스트

1. 내부 테스트 트랙에 AAB를 업로드하고 릴리스를 게시한다.
2. 테스터 이메일을 추가하고 참여 링크를 전달한다.
3. Play 스토어 참여 링크로 설치한 빌드에서 아래를 확인한다.

- 카카오·네이버 로그인과 앱 복귀
- 앱 재실행 로그인 유지, 로그아웃, 회원 탈퇴
- 지도 로딩, 위치 권한 허용·거절, 검색과 캐러셀
- 거래글 작성·수정·삭제, 댓글, 신고, 차단
- 채팅 송수신, 이미지, Android 뒤로가기, 키보드
- 포그라운드·백그라운드·종료 상태의 댓글/채팅 푸시
- 알림을 눌렀을 때 목적 화면 이동과 읽음 처리
- 개인정보처리방침과 계정 삭제 외부 URL

내부 테스트는 최대 100명까지 빠르게 배포할 수 있다. 같은 사용자가 비공개 테스트로 이동할 때는 내부 테스트 참여 상태 때문에 원하는 트랙이 보이지 않는지 확인한다.

## 6. App content 작성

입력 문구와 화면 캡처 기준은 [Google Play 등록정보 초안](./play-store-listing.md)을 사용한다.

- 개인정보처리방침: 공개 URL 입력
- 계정 삭제: 앱 내부 경로와 공개 웹 URL 모두 입력
- 앱 액세스: 일부 기능이 로그인으로 제한됨. 심사용 계정과 절차 제공
- 광고: 네이버 제휴 상품·수수료 노출을 기준으로 보수적으로 `광고 포함` 권장
- 타깃 연령: 현재 서비스 정책상 만 14세 이상 기준 확인
- 콘텐츠 등급: 거래글·댓글·채팅 등 사용자 생성 콘텐츠를 사실대로 응답
- Data safety: 웹, Android, 서버, 분석·오류·푸시 SDK 전체의 실제 처리를 기준으로 응답

## 7. 비공개 테스트와 프로덕션 액세스

2023년 11월 13일 이후 생성된 대상 개인 개발자 계정은 최소 12명이 14일 동안 연속으로 비공개 테스트에 참여해야 프로덕션 액세스를 신청할 수 있다.

권장 순서:

1. 내부 테스트로 로그인·삭제·푸시까지 차단 이슈를 해결한다.
2. 비공개 테스트 트랙에 새 릴리스를 만든다.
3. 12명보다 여유 있게 테스터를 초대하고 참여 상태를 확인한다.
4. 14일 동안 실제 핵심 기능 피드백과 수정 내역을 기록한다.
5. 요구 기간 충족 후 프로덕션 액세스를 신청한다.
6. 정식 출시 전 versionName/versionCode와 최종 등록정보를 갱신한다.

## 공식 참고 자료

- [신규 개인 개발자 계정의 비공개 테스트 요구사항](https://support.google.com/googleplay/android-developer/answer/14151465)
- [테스트 트랙 설정](https://support.google.com/googleplay/android-developer/answer/9845334)
- [심사용 앱 액세스 정보](https://support.google.com/googleplay/android-developer/answer/9859455)
- [앱 계정 삭제 요구사항](https://support.google.com/googleplay/android-developer/answer/13327111)
- [사용자 생성 콘텐츠 정책](https://support.google.com/googleplay/android-developer/answer/9876937)
- [Play App Signing](https://developer.android.com/studio/publish/app-signing)
- [Target API 요구사항](https://developer.android.com/google/play/requirements/target-sdk)
