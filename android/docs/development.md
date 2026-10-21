# Android 개발·테스트 가이드

## 기술 기준

- Expo SDK 57 / React Native 0.86
- TypeScript strict mode
- React Native New Architecture
- 웹을 WebView로 감싸지 않고 React Native 네이티브 컴포넌트로 화면을 구현한다.
- 로그인, 알림처럼 계약 변경 가능성이 큰 기능은 기반이 안정된 뒤 별도 이슈로 추가한다.

Expo는 React Native 프레임워크다. Firebase Messaging이나 소셜 로그인처럼 네이티브 설정이 필요한 기능은 Expo development build와 config plugin을 사용하고, 필요하면 Expo가 생성한 Android 네이티브 프로젝트를 확장한다.

## 브랜치 흐름

```text
feat/<issue>-android-* -> android -> main
```

- `android`: Android 통합·테스트 브랜치
- 기능 개발은 이슈마다 `android`에서 브랜치를 생성한다.
- Android 기능 브랜치에서는 루트 `android/`와 Android 전용 CI만 변경한다.
- `android`에서 CI와 실제 기기 검증을 마친 뒤에만 `main`으로 병합한다.
- 백엔드와 다른 플랫폼 코드는 Android 작업에서 변경하지 않는다.

## 환경 구분

| 환경 | `APP_VARIANT` | 앱 이름 | application ID | URL scheme | API 기준 주소 |
| --- | --- | --- | --- | --- | --- |
| 개발 | `development` | 가치가챠 Dev | `com.dev.gachigacha.app` | `gachigacha-dev` | `https://dev.gachigacha.kro.kr` |
| 운영 | `production` | 가치가챠 | `com.gachigacha.app` | `gachigacha` | `https://gachigacha.kro.kr` |

Android에서는 Bundle ID에 대응하는 값을 `applicationId` 또는 package name이라고 부른다. Play Console에서는 두 application ID를 서로 다른 앱으로 취급한다.

## 무엇을 직접 설치해야 하나

CI에서 만든 APK만 실제 휴대폰에 설치해 확인하려면 별도 설치가 필요 없다. 로컬에서 코드를 실행하거나 에뮬레이터로 확인하려면 아래 도구가 필요하다.

1. Node.js 22.13 이상 25 미만
2. JDK 17
3. Android Studio 안정 버전
4. Android SDK Platform, SDK Build-Tools, SDK Platform-Tools
5. Android Emulator와 가상 기기(AVD), 또는 USB 디버깅을 켠 실제 Android 기기

Android Studio 설치 마법사에서 권장 SDK를 함께 설치할 수 있고, Emulator도 Android Studio에 포함된다.

- [Android Studio 설치](https://developer.android.com/studio/install)
- [Android 가상 기기 만들기](https://developer.android.com/studio/run/managing-avds)
- [Android 빌드의 JDK 기준](https://developer.android.com/build/jdks)

### 1. JDK 17 확인

Temurin 17 같은 OpenJDK 17 배포판을 설치한 뒤 확인한다.

```bash
java -version
```

출력에 `17`이 보여야 한다. Android Studio에서는 `Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK`도 같은 JDK 17로 맞춘다.

### 2. Android Studio와 SDK 설치

Android Studio 설치 마법사의 Standard 설정을 완료한다. 이후 `Tools > SDK Manager`에서 아래 항목을 확인한다.

- SDK Platforms: 프로젝트가 사용하는 최신 Android API
- SDK Tools: Android SDK Build-Tools
- SDK Tools: Android SDK Platform-Tools
- SDK Tools: Android Emulator
- SDK Tools: Android SDK Command-line Tools (latest)

### 3. Emulator 만들기

1. Android Studio의 `Tools > Device Manager`를 연다.
2. `Create Virtual Device`를 누른다.
3. 일반적인 휴대폰 크기 검증을 위해 Pixel 계열 기기를 고른다.
4. Google Play가 포함된 최신 안정 API 이미지를 내려받는다.
5. 생성한 기기의 실행 버튼을 누른다.

에뮬레이터가 느리면 BIOS/UEFI의 CPU 가상화가 켜져 있는지 확인한다. 실제 기기를 사용할 때는 개발자 옵션과 USB 디버깅을 켜고 `adb devices`에서 연결 상태를 확인한다.

### 4. 환경 변수

Windows의 일반적인 SDK 경로는 `%LOCALAPPDATA%\Android\Sdk`, macOS는 `$HOME/Library/Android/sdk`, Linux는 `$HOME/Android/Sdk`다.

macOS/Linux 셸 설정 예시:

```bash
export JAVA_HOME="/path/to/jdk-17"
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
```

Windows에서는 시스템 환경 변수에 `JAVA_HOME`, `ANDROID_HOME`을 추가하고 `Path`에 `%ANDROID_HOME%\platform-tools`와 `%ANDROID_HOME%\emulator`를 추가한다.

### WSL2 사용 시 주의

현재 개발 환경처럼 저장소가 WSL2 안에 있다면 Windows용 Gradle·Node와 WSL용 Gradle·Node를 한 빌드에서 섞지 않는다. 가장 단순한 선택은 다음 둘 중 하나다.

- 당장 확인: GitHub Actions의 APK를 휴대폰에 직접 설치한다.
- 로컬 네이티브 개발: Windows 파일 시스템에 별도 checkout을 두고 Windows의 Node.js, JDK 17, Android Studio, SDK를 함께 사용한다.

Windows Android Studio에서 WSL 내부 경로를 바로 열면 파일 시스템 경계와 SDK 경로 차이 때문에 빌드가 느리거나 실패할 수 있다.

## 로컬 실행

최초 한 번:

```bash
cd android
npm ci
npm run check
npm run android:dev
```

`android:dev`는 개발 application ID로 네이티브 프로젝트를 생성하고, 선택한 에뮬레이터 또는 연결된 실제 기기에 개발 앱을 설치한다. 이후에는 Metro 개발 서버를 실행해 빠르게 확인할 수 있다.

```bash
cd android
npm run start:dev
```

Android 앱을 실행한 상태에서는 Fast Refresh로 TypeScript/React Native 변경을 반영한다. 네이티브 설정이나 라이브러리가 바뀌면 `npm run android:dev`로 다시 빌드한다.

## APK와 AAB의 차이

| 파일 | 용도 | 기기에 바로 설치 |
| --- | --- | --- |
| APK (`.apk`) | 개발, QA, 실제 기기 직접 테스트 | 가능 |
| AAB (`.aab`) | Google Play가 기기별 APK를 만들기 위한 제출 파일 | 불가능 |

일반적인 debug APK는 Metro 개발 서버 연결을 전제로 할 수 있다. CI는 휴대폰에서 단독 실행할 수 있도록 개발 application ID의 release variant를 사용한 `preview APK`를 만든다. 이 파일은 내부 QA용이며 Play 제출용 운영 릴리스는 아니다. Play Console에는 최종 서명된 운영 AAB를 제출한다.

- [Expo: APK 빌드와 설치](https://docs.expo.dev/build-reference/apk/)
- [Expo: 로컬 AAB 생성](https://docs.expo.dev/guides/local-app-production/)

## CI 산출물로 실제 휴대폰에서 확인

CI 실행 기준은 다음과 같다.

- Android PR: TypeScript, 앱 설정, 개발·운영 JS 번들만 빠르게 검증한다.
- `android` 브랜치 push: 위 검증 후 휴대폰 단독 실행용 preview APK를 백그라운드 생성한다.
- 수동 실행: GitHub Actions의 `Run workflow`로 preview APK를 다시 생성할 수 있다.
- AAB: 일상 CI에서는 만들지 않고 출시 작업에서만 생성한다.

설치 방법:

1. GitHub 저장소의 `Actions`에서 성공한 `Android Quality` 실행을 연다.
2. 실행 하단 `Artifacts`에서 `gachi-gacha-android-preview`를 내려받는다.
3. 압축을 풀어 `app-release.apk`를 휴대폰으로 옮긴다.
4. 휴대폰에서 APK를 열고, 해당 브라우저/파일 앱의 `알 수 없는 앱 설치`를 이번 설치에만 허용한다.
5. `가치가챠 Dev` 앱을 실행해 탭 이동, 화면 잘림, 뒤로가기, 글자 크기를 확인한다.

USB로 연결했다면 다음 명령으로도 설치할 수 있다.

```bash
adb install -r app-release.apk
```

APK는 신뢰할 수 있는 이 저장소의 CI 산출물만 설치한다. 개발 앱은 `com.dev.gachigacha.app`이므로 추후 운영 앱과 동시에 설치할 수 있다.

## AAB 생성과 확인

AAB는 일상적인 PR/push CI에서 생성하지 않는다. Play 출시 준비 시 운영 설정과 upload key를 연결한 뒤 릴리스 작업에서만 만든다.

로컬 생성 절차:

```bash
cd android
APP_VARIANT=production npx expo prebuild --platform android --clean --no-install
cd android
./gradlew bundleRelease
```

생성 위치:

```text
android/android/app/build/outputs/bundle/release/app-release.aab
```

Android Studio의 `Build > Analyze APK`에서 AAB를 선택하면 패키지 구성과 용량을 확인할 수 있다. 최종 출시 전에는 다음 작업을 별도 릴리스 이슈로 진행한다.

1. Play Console에서 Play App Signing 설정
2. 팀 전용 upload key 생성 및 비밀 저장소 보관
3. CI에 운영 서명 환경변수 등록
4. 서명된 AAB 생성
5. Play 내부 테스트 트랙에 업로드
6. 내부 테스터 설치·업데이트 검증

## 현재 앱에서 확인할 범위

- 개발 앱 이름과 application ID가 운영 앱과 분리되는가
- 상태 표시줄과 하단 시스템 영역에 콘텐츠가 가려지지 않는가
- 거래/교환, 지도, 검색 탭을 이동할 수 있는가
- 다양한 화면 크기와 시스템 글자 크기에서 레이아웃이 깨지지 않는가
- Android 뒤로가기 시 앱이 비정상 종료되지 않는가

거래/교환 탭은 공개 거래 API를 연결해 목록, 검색, 페이지 추가 로딩, 당겨서 새로고침과 오류 복구를 네이티브 화면으로 제공한다. 목록 카드를 선택하면 native stack으로 상세 화면에 이동해 이미지와 거래 조건을 확인할 수 있다.

거래 목록은 전체·교환 가능·진행 중·교환 완료 필터를 공개 API의 `status` 조건으로 조회한다. 검색어 또는 상태가 달라지면 첫 페이지부터 다시 요청하며, 이전 조건의 추가 페이지 응답이 늦게 도착해 새 목록에 섞이지 않도록 요청 식별자를 확인한다. 추가 페이지 로딩만 실패한 경우 이미 불러온 목록은 유지하고 목록 끝에서 재시도할 수 있다.

거래 상세 응답에 구매 매장이나 거래 장소 좌표가 있으면 `지도에서 보기`를 제공한다. 매장 상세 길찾기와 같은 공용 외부 액션을 사용해 설치된 지도 앱을 우선 열고, 연결할 수 없으면 Google 지도 웹으로 이동한다.

검색 탭은 웹과 동일하게 검색어로 관련 카테고리를 찾은 뒤 해당 카테고리의 가챠를 조회한다. 썸네일, 이름, 카테고리, 보유 매장 수와 페이지 추가 로딩을 네이티브 UI로 제공한다. 검색 결과를 선택하면 지도 탭으로 이동해 홍대 중심 3km 내 보유 매장을 가까운 순서로 보여준다. 가챠 조건을 해제하면 같은 범위의 전체 매장도 확인할 수 있다.

현재 지도 탭의 매장 목록은 기본적으로 웹이 제공 중인 홍대 서비스 영역을 사용한다. 사용자가 `내 위치에서 찾기`를 선택한 경우에만 Android 전경 위치 권한을 요청하고, 현재 위치 중심 3km의 매장을 조회한다. 권한을 거부하거나 위치 확인에 실패하면 홍대 목록을 그대로 유지한다. 좌표는 지속 추적하거나 앱 저장소에 남기지 않고 주변 매장 조회 요청에만 전달한다.

매장 카드를 선택하면 상세 화면에서 사진, 방문 정보, 가격과 보유 가챠를 확인할 수 있고, 보유 가챠를 선택하면 해당 가챠의 매장 검색 결과로 돌아간다. 지도 키가 연결된 빌드는 같은 검색 결과를 지도 핀으로도 표시한다. 글쓰기·로그인과 알림은 각각 계약과 화면이 확정된 뒤 별도 이슈에서 연결한다.

### Google 지도 설정

주변 매장은 `react-native-maps`의 Google 지도 위에 핀으로 표시한다. 지도 키가 없는 빌드는 빈 지도 대신 기존 거리순 매장 목록만 표시하므로 로컬 개발과 PR 검증이 중단되지 않는다. 키를 코드나 `.env` 파일에 커밋하지 않는다.

Google Cloud Console에서 Maps SDK for Android를 활성화하고 개발·운영 키를 분리한다. 각 키에는 다음 제한을 적용한다.

- 애플리케이션 제한: Android 앱
- 개발 키: package `com.dev.gachigacha.app`과 개발/preview 서명 인증서 SHA-1
- 운영 키: package `com.gachigacha.app`과 Play App Signing 인증서 SHA-1
- API 제한: Maps SDK for Android만 허용

GitHub Actions에는 다음 Repository Secret을 등록한다.

```text
ANDROID_GOOGLE_MAPS_API_KEY_DEV
ANDROID_GOOGLE_MAPS_API_KEY_PROD
```

로컬 PowerShell에서는 현재 터미널 세션에만 키를 넣고 개발 앱을 다시 네이티브 빌드한다.

```powershell
$env:GOOGLE_MAPS_ANDROID_API_KEY_DEV="발급받은-개발-키"
npm run android:dev
```

환경변수 이름은 앱 설정에서 다음과 같이 구분한다.

```text
GOOGLE_MAPS_ANDROID_API_KEY_DEV
GOOGLE_MAPS_ANDROID_API_KEY_PROD
```

지도 핀의 말풍선을 누르면 매장 상세로 이동한다. 현재 위치 검색 전에는 홍대 중심을 사용하고, 사용자가 위치 권한을 허용해 현재 위치 검색을 실행하면 지도 중심과 매장 핀을 함께 갱신한다.

매장 상세의 `길찾기`는 사용자가 버튼을 누른 경우에만 설치된 지도 앱을 열며, 앱 연결이 실패하면 좌표를 사용한 Google 지도 웹으로 이동한다. 전화번호가 제공된 매장에는 `전화`를 노출하고 기기의 전화 앱으로 연결한다. 매장과 거래글의 `공유`는 앱 설치 여부와 관계없이 열 수 있는 운영 웹 공개 URL을 Android 공유 시트로 전달한다. 외부 앱 연결 실패는 앱이 종료되지 않도록 안내 문구로 처리한다.

거래글과 매장 상세의 사진을 누르면 공용 전체 화면 뷰어를 열 수 있다. 좌우 스와이프로 사진을 넘기고 현재 순서를 확인하며, 화면의 닫기 버튼이나 Android 시스템 뒤로가기로 상세 화면에 돌아온다. 뷰어는 React Native 기본 `Modal`과 이미지 컴포넌트로 구현해 별도의 네이티브 의존성을 추가하지 않는다.

Play Console의 데이터 보안 항목에서는 위치 좌표가 주변 매장 API로 전송된다는 사실을 기준으로 작성해야 한다. 서버 로그 보관 여부와 삭제 정책은 출시 전에 백엔드 운영 정책을 확인하고 최종 신고 내용을 확정한다.

## 모바일 내비게이션과 안전영역 원칙

하단 탭은 사용 빈도가 높고 서로 대등한 핵심 목적지만 둔다.

- 하단 탭: 거래/교환, 지도, 검색, 채팅
- 상단 앱 바: 가치가챠 브랜드, 알림, 로그인 또는 프로필
- 마이페이지: 프로필에서 진입하며 하단 핵심 탭으로 중복하지 않는다.
- 알림: 모바일에서는 작은 드롭다운보다 전체 알림 화면으로 이동시킨다. 읽지 않은 알림은 배지로 알린다.

채팅·알림·로그인 화면이 실제로 연결되기 전에는 동작하지 않는 버튼을 먼저 노출하지 않는다. 기능이 포팅되는 이슈에서 각 목적지를 함께 추가한다.

Android의 제스처 내비게이션과 3버튼 내비게이션은 기기 설정에 따라 하단 시스템 영역 높이가 다르다. 따라서 하단 탭의 위치를 임의의 고정 여백으로 올리지 않고 `react-native-safe-area-context`가 제공하는 `insets.bottom`을 높이와 내부 여백에 반영한다. 새 화면에서도 다음 원칙을 지킨다.

- 상태 표시줄과 시스템 내비게이션 바 높이를 숫자로 가정하지 않는다.
- 클릭 가능한 UI는 시스템 안전영역 안쪽에 둔다.
- Galaxy 3버튼, Android 제스처, 가로·세로 화면에서 겹침을 확인한다.
- 키보드가 열리면 하단 탭을 숨겨 입력 영역을 방해하지 않게 한다.

참고: [Android edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge), [React Navigation bottom tabs](https://reactnavigation.org/docs/bottom-tab-navigator/)

## 앱 아이콘 원칙

앱 런처에는 루챠 캐릭터 자산 `assets/lucha-app-icon.png`을 사용한다. 중요한 얼굴 요소는 Android adaptive icon의 중앙 안전영역 안에 두어 원형·스쿼클·둥근 사각형 마스크에서도 잘리지 않게 한다. 이전 G 아이콘이 테마 아이콘으로 다시 보이지 않도록 별도의 구형 monochrome 자산은 연결하지 않는다.

Play Console 등록정보용 아이콘은 런처 빌드 자산과 별도로 `assets/play-store-icon.png`에 보관한다. `npm run config:check`가 아래 조건을 자동 검증한다.

- 512×512 PNG
- 32-bit PNG
- 1,024KB 이하
- 문구, 순위·가격·할인·Play 배지처럼 오해를 유발하는 요소 없음

참고: [Google Play 그래픽 자산 요구사항](https://support.google.com/googleplay/android-developer/answer/9866151), [Android adaptive icon 디자인](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
