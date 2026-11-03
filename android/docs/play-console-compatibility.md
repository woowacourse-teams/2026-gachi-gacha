# Google Play Android 15·16 호환성 대응

> 적용 이슈: #604

Play Console의 사전 보고서는 업로드한 AAB 안의 앱 코드와 모든 라이브러리를 정적
분석한다. 경고에 표시된 시작 위치가 우리 소스인지 React Native·Material Components
같은 의존성인지 구분한 뒤 대응한다.

## 이번 변경에서 직접 해결하는 항목

| 경고 | 원인 | 대응 |
| --- | --- | --- |
| 대형 화면 방향 제한 | Expo `orientation: portrait`가 manifest에 `screenOrientation="portrait"`를 생성 | `orientation: default`와 Android config plugin으로 manifest의 방향 제한을 삭제 |
| Material edge-to-edge API | `react-native-screens`가 Material Components 1.13.0을 참조 | 앱이 1.14.0을 명시해 API 35 호환 수정이 포함된 버전을 선택 |
| DEX 난독화 1% | 운영 release에서 R8 최소화가 꺼짐 | production만 코드 최소화와 리소스 축소를 활성화 |

개발 preview APK는 스택 추적과 QA를 쉽게 유지하기 위해 R8 최적화를 끈다. 운영 AAB는
`APP_VARIANT=production`에서만 다음 속성을 `true`로 생성한다.

```properties
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

## 새 AAB에서도 남을 수 있는 경고

`com.facebook.react.modules.statusbar.StatusBarModule`과
`com.facebook.react.views.view.WindowUtilKt` 시작 위치는 React Native 0.86.3 내부 코드다.
앱은 status/navigation bar 배경색이나 cutout mode를 직접 설정하지 않지만, Play의 정적
분석은 실행 경로와 무관하게 번들 안의 지원 중단 API 참조를 감지할 수 있다.

이 코드를 `node_modules`에서 임의 패치하면 Expo·React Native의 edge-to-edge와 시스템
바 제어를 깨뜨릴 수 있으므로 패치하지 않는다. 새 운영 AAB를 올린 뒤 Material 시작
위치가 사라지고 React Native 시작 위치만 남는지 확인한다. React Native 또는 Expo의
후속 안정 버전에서 해당 참조가 제거되면 의존성을 정상 업그레이드한다.

## 생성 결과 확인

```bash
cd android
npm ci

APP_VARIANT=development \
npx expo prebuild --platform android --clean --no-install
APP_VARIANT=development npm run play-compatibility:verify

APP_VARIANT=production \
npx expo prebuild --platform android --clean --no-install
APP_VARIANT=production npm run play-compatibility:verify
```

운영 AAB는 기존 `Android Play Release` workflow로 빌드한다. 업로드할 때마다
`versionCode`를 증가시키고 Play Console의 영향을 받는 Bundle이 새 AAB로 바뀌었는지
확인한다.

## 대형 화면·회전 실제 기기 QA

- 휴대전화 가로·세로, 태블릿 또는 폴더블 에뮬레이터에서 WebView가 잘리지 않는다.
- 지도 카드·재검색·줌·현재 위치 UI가 겹치지 않는다.
- 채팅 목록·방·키보드·입력창이 회전 뒤에도 현재 방과 스크롤을 유지한다.
- 로그인 복귀, 알림 딥링크, 이미지 선택 뒤 회전해도 중복 화면이 생기지 않는다.
- 분할 화면에서 주요 버튼과 하단 입력창이 시스템 영역 뒤로 숨지 않는다.

## 공식 기준

- [Android 15 edge-to-edge 변경](https://developer.android.com/about/versions/15/behavior-changes-15)
- [Android 적응형 화면 방향·크기 조절 가이드](https://developer.android.com/develop/adaptive-apps/guides/app-orientation-aspect-ratio-resizability)
- [Expo app config의 orientation](https://docs.expo.dev/versions/latest/config/app/#orientation)
- [Material Components Android 1.14.0](https://github.com/material-components/material-components-android/releases/tag/1.14.0)
