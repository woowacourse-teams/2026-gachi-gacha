# Android contribution rules

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
