# Android contribution rules

- Android 작업에서는 `android/` 밖의 파일을 수정하지 않는다. 웹 UI 변경이 필요해
  보여도 frontend 코드를 Android에 맞춰 바꾸지 말고 제품 담당자와 frontend 작업으로
  분리한다.
- 기본 앱 셸은 배포된 GachiGacha 웹 모바일 화면을 WebView로 표시한다. 화면·문구·동선
  일치는 Android에서 UI를 재작성하는 방식이 아니라 같은 웹 배포본을 사용하는 방식으로
  보장한다.
- OAuth, App Links, 푸시, 파일 선택, 공유, 시스템 뒤로가기처럼 운영체제 연동이 필요한
  부분만 Android 계층이 담당한다. 네이티브 동작은 웹의 사용자 반응 경로를 바꾸지 않는다.

- Before implementing or changing an Android screen, fetch and inspect the matching
  mobile-responsive flow on the latest `origin/main` frontend.
- Preserve the web information architecture, labels, field order, states, and user
  reaction path. Do not invent Android-only interactions or duplicate menus without
  explicit product approval.
- Native device capabilities may replace implementation details, but not the
  user-visible flow.
- Every full-screen list, modal, bottom sheet, composer, and bottom action must account
  for `react-native-safe-area-context` bottom insets. Treat the top of the Android
  system navigation area as the visible viewport bottom.
- Use `src/shared/useBottomContentPadding.ts` for scroll content and bottom-fixed UI.
  Do not rely on a fixed bottom padding alone.
- Follow `docs/web-mobile-parity.md` and verify gesture navigation, three-button
  navigation, small screens, large text, and the open keyboard where relevant.
