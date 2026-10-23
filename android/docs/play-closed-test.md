# Google Play 비공개 테스트 출시 가이드

## 최소 출시 범위

첫 비공개 테스트에서는 로그인·채팅·알림이 필수가 아니다. 운영 빌드는 홍대 주변 매장 지도, 매장 상세와 가챠 검색만 제공하는 공개 탐색 앱으로 제출한다. 개발 빌드의 거래 기능은 보존하지만 운영 빌드에서는 거래글·댓글을 노출하지 않는다. 아직 구현하지 않은 버튼이나 빈 화면도 먼저 노출하지 않는다.

거래 기능을 후속 운영 버전에서 다시 활성화할 때는 사용자 생성 콘텐츠 안전 기능을 먼저 확인한다.

- 앱 안에서 게시글·댓글과 작성자를 명확히 신고할 수 있는가
- 차단한 작성자의 공개 콘텐츠가 다시 보이지 않는가
- 댓글을 작성하기 전에 이용약관 및 운영정책을 확인하고 동의하는가
- 신고를 실제로 검토하고 조치할 운영 경로가 있는가

운영 앱 헤더의 정보 버튼은 실제 웹 개인정보처리방침 `https://gachigacha.kro.kr/privacy`를 연다. 존재하지 않는 약관 URL이나 준비되지 않은 계정 기능은 첫 버전에 노출하지 않는다.

## 고정되는 값

- 운영 package: `com.gachigacha.app`
- 개발 package: `com.dev.gachigacha.app`
- 운영 API: `https://gachigacha.kro.kr`
- 첫 제출 versionName 기본값: `0.1.0`
- 첫 제출 versionCode 기본값: `1`

Play Console에 첫 AAB를 올린 뒤 package는 변경할 수 없다. 이후 기능은 같은 package와 서명을 유지하고 versionCode만 증가시켜 업데이트한다. 로그인도 후속 버전에서 추가할 수 있다.

## 1. Play App Signing과 upload key

Play Console에서 `com.gachigacha.app` 앱을 만들고 Play App Signing을 사용한다. 팀의 upload key는 Play가 사용자에게 배포하는 app signing key와 다른 용도다.

upload key가 아직 없다면 안전한 로컬 환경에서 한 번만 생성한다.

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore gachigacha-upload.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

keystore 파일과 비밀번호는 저장소, Slack, 이슈, PR에 올리지 않는다. 팀 비밀 저장소에 복구 가능하게 보관한다.

## 2. GitHub Actions Secrets

저장소 Settings의 Actions secrets에 다음 값을 등록한다.

```text
ANDROID_KAKAO_MAP_NATIVE_APP_KEY_PROD
ANDROID_UPLOAD_KEYSTORE_BASE64
ANDROID_UPLOAD_KEYSTORE_PASSWORD
ANDROID_UPLOAD_KEY_ALIAS
ANDROID_UPLOAD_KEY_PASSWORD
```

Windows PowerShell에서 keystore를 Base64 문자열로 변환하는 예시는 다음과 같다. 출력값 자체는 공유하지 않고 `ANDROID_UPLOAD_KEYSTORE_BASE64`에 직접 저장한다.

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\안전한\경로\gachigacha-upload.jks"))
```

## 3. 운영 AAB 생성

GitHub Actions에서 `Android Play Release`를 수동 실행한다.

- `version_name`: 사용자에게 보이는 버전. 예: `0.1.0`
- `version_code`: Play 업로드마다 증가하는 양의 정수. 첫 제출은 `1`

workflow는 다음 조건을 모두 확인한 뒤 AAB를 artifact로 제공한다.

1. 운영 package와 운영 API로 clean prebuild
2. 위치·외부 저장소·시스템 오버레이 등 미사용 권한 제거
3. upload key가 없으면 즉시 실패
4. 서명된 `app-release.aab` 생성 및 `jarsigner` 검증
5. versionName, versionCode와 SHA-256을 Summary에 기록

일반 `Android Quality` workflow의 APK는 실제 기기 QA용이며 Play에 제출하지 않는다.

## 4. Kakao Maps 운영 서명 등록

직접 설치한 APK와 Google Play에서 설치한 앱의 서명 인증서는 다를 수 있다. Play Console의 App integrity에서 **App signing certificate**를 내려받거나 SHA-1 정보를 확인한 뒤, 그 인증서의 Kakao key hash를 운영 package `com.gachigacha.app`에 등록한다.

DER 인증서 파일을 받은 경우:

```bash
openssl sha1 -binary app-signing-certificate.der | openssl base64
```

upload key hash만 등록하면 Play가 다시 서명해 배포한 앱에서 Kakao Map 인증이 실패할 수 있다. Play app signing hash를 반드시 등록한다.

## 5. Play Console 제출 항목

비공개 테스트를 시작하기 전에 최소한 다음 항목을 완료한다.

입력 문구와 화면 캡처 기준은 [Google Play 최소 등록정보 초안](./play-store-listing.md)을 사용한다.

- 앱 이름, 짧은/전체 설명, 카테고리, 연락처
- 512×512 아이콘 `assets/play-store-icon.png`
- 휴대폰 스크린샷과 1024×500 feature graphic
- 개인정보처리방침 공개 URL과 앱 내부 접근 경로
- 광고 포함 여부
- 앱 액세스: 현재 버전은 로그인 제한 없음으로 신고
- 타깃 연령과 콘텐츠 등급: 공개 게시글·댓글(UGC)을 사실대로 응답
- 데이터 보안: 앱과 서버의 실제 수집·전송·삭제 정책을 기준으로 응답
- UGC 신고·차단 및 이용약관 동의 경로 확인

## 6. 14일 비공개 테스트

개인 개발자 계정의 적용 대상이라면 최소 12명이 14일 동안 연속으로 테스트에 참여 상태를 유지해야 한다. 기간 중에도 같은 package로 versionCode를 올려 수정 AAB를 배포할 수 있다. 테스터가 opt-out하지 않도록 안내하고, 실제 핵심 기능 사용과 피드백 기록을 남긴다.

권장 순서:

1. 내부 테스트에 AAB 업로드 후 지도, 검색, 이미지, 뒤로가기와 네트워크 실패 확인
2. 문제없으면 동일 앱의 비공개 테스트 트랙에 새 릴리스 생성
3. 12명보다 여유 있는 테스터를 초대하고 opt-in 링크 전달
4. 테스트 기간 중 치명적 오류만 작은 업데이트로 수정
5. 14일 충족 후 테스트 내용과 개선 결과를 정리해 프로덕션 액세스 신청

로그인을 나중에 추가하면 Play Console의 앱 액세스에 재사용 가능한 심사용 소셜 계정과 영문 접근 방법을 함께 등록한다.

## 공식 참고 자료

- [신규 개인 개발자 계정의 비공개 테스트 요구사항](https://support.google.com/googleplay/android-developer/answer/14151465)
- [테스트 트랙 설정](https://support.google.com/googleplay/android-developer/answer/9845334)
- [심사용 로그인 정보 기준](https://support.google.com/googleplay/android-developer/answer/15748846)
- [사용자 생성 콘텐츠 정책](https://support.google.com/googleplay/android-developer/answer/9876937)
- [Play App Signing](https://developer.android.com/studio/publish/app-signing)
- [Target API 요구사항](https://developer.android.com/google/play/requirements/target-sdk)
