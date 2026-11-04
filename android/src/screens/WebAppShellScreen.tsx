import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { getWebAppBaseUrl } from '../config/webShell';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import {
  readAuthTokens,
  storeAuthTokens,
  subscribeAuthTokens,
} from '../domains/auth/authTokenStorage';
import type { AuthTokens, MobileOAuthProvider } from '../domains/auth/authTypes';
import { loginWithMobileOAuth } from '../domains/auth/mobileOAuthLogin';
import { createPushNavigationQueue } from '../domains/notification/pushNavigationQueue';
import { usePushNotifications } from '../domains/notification/usePushNotifications';
import { createWebShellBackController } from '../domains/webShell/webShellBackController';
import {
  createWebShellSessionSnapshotRequestScript,
  parseWebShellSessionSnapshot,
} from '../domains/webShell/webShellSessionBridge';
import {
  classifyWebShellNavigation,
  createWebShellAuthenticationCompletionScript,
  createWebShellBootstrapScript,
  createWebShellChatListNavigationScript,
  createWebShellConfirmLeaveScript,
  createWebShellNavigationScript,
  createWebShellOverlayBackScript,
  createWebShellRuntimeScript,
  createWebShellSameOriginNavigationScript,
  createWebShellSessionSyncScript,
  isTrustedWebShellMessageSource,
  parseWebShellMessage,
} from '../domains/webShell/webShellPolicy';
import { colors } from '../theme/colors';

const EXIT_CONFIRMATION_WINDOW_MS = 2_000;
const WEB_SESSION_READY_FALLBACK_MS = 2_000;

export function WebAppShellScreen() {
  const appBaseUrl = getWebAppBaseUrl();
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const isChatRoomOpenRef = useRef(false);
  const backControllerRef = useRef<ReturnType<
    typeof createWebShellBackController
  > | null>(null);
  const lastRootBackPressAt = useRef(0);
  const leaveConfirmationOpenRef = useRef(false);
  const lastNonLoginUrlRef = useRef(appBaseUrl);
  const oauthInFlightRef = useRef(false);
  const webLogoutInFlightRef = useRef(false);
  const nativeSessionTokensRef = useRef<AuthTokens | null | undefined>(undefined);
  const nativeSessionRevisionRef = useRef(0);
  const webSessionReadyFallbackRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const webViewLoadedRef = useRef(false);
  const pushNavigationQueueRef = useRef(createPushNavigationQueue());
  const topLevelUrlRef = useRef(appBaseUrl);
  const { authenticate, logout, status } = useAuthSession();
  const [nativeSessionTokens, setNativeSessionTokens] = useState<
    AuthTokens | null | undefined
  >(undefined);
  const [authenticatingProvider, setAuthenticatingProvider] =
    useState<MobileOAuthProvider | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const clearWebSessionReadyFallback = useCallback(() => {
    if (webSessionReadyFallbackRef.current === null) {
      return;
    }

    clearTimeout(webSessionReadyFallbackRef.current);
    webSessionReadyFallbackRef.current = null;
  }, []);

  const markWebSessionReady = useCallback(() => {
    clearWebSessionReadyFallback();
    const pendingPushPath = pushNavigationQueueRef.current.markReady();
    if (pendingPushPath) {
      webViewRef.current?.injectJavaScript(
        createWebShellNavigationScript(pendingPushPath),
      );
    }
  }, [clearWebSessionReadyFallback]);

  const scheduleWebSessionReadyFallback = useCallback(() => {
    clearWebSessionReadyFallback();
    webSessionReadyFallbackRef.current = setTimeout(
      markWebSessionReady,
      WEB_SESSION_READY_FALLBACK_MS,
    );
  }, [clearWebSessionReadyFallback, markWebSessionReady]);

  useEffect(
    () => () => clearWebSessionReadyFallback(),
    [clearWebSessionReadyFallback],
  );

  const openPushPath = useCallback((path: string) => {
    const pathToOpen = pushNavigationQueueRef.current.request(path);
    if (!pathToOpen) return;

    webViewRef.current?.injectJavaScript(
      createWebShellNavigationScript(pathToOpen),
    );
  }, []);

  usePushNotifications(openPushPath);

  const updateNativeSession = useCallback((tokens: AuthTokens | null) => {
    nativeSessionRevisionRef.current += 1;
    nativeSessionTokensRef.current = tokens;
    setNativeSessionTokens((current) =>
      current?.accessToken === tokens?.accessToken &&
      current?.refreshToken === tokens?.refreshToken && current !== undefined
        ? current : tokens,
    );
  }, []);

  useEffect(() => subscribeAuthTokens((tokens) => {
    // Cold boot는 기존 AuthSessionProvider 복원 완료를 기다린다.
    if (nativeSessionTokensRef.current !== undefined) updateNativeSession(tokens);
  }), [updateNativeSession]);

  const refreshNativeSession = useCallback(async () => {
    const revision = nativeSessionRevisionRef.current;
    const tokens = await readAuthTokens();
    if (revision !== nativeSessionRevisionRef.current) return;
    updateNativeSession(tokens);
    if (webViewLoadedRef.current && !oauthInFlightRef.current) {
      webViewRef.current?.injectJavaScript(createWebShellSessionSyncScript(tokens));
    }
  }, [updateNativeSession]);

  useEffect(() => {
    if (
      nativeSessionTokens === undefined ||
      status === 'loading' ||
      oauthInFlightRef.current ||
      !webViewLoadedRef.current
    ) {
      return;
    }

    webViewRef.current?.injectJavaScript(
      createWebShellSessionSyncScript(nativeSessionTokens),
    );
  }, [nativeSessionTokens, status]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    void refreshNativeSession();
  }, [refreshNativeSession, status]);

  // 갤러리/권한 화면에서 돌아온 것은 새 앱 시작이 아니다. 살아 있는 웹 문서는
  // 웹의 인증 갱신을 유지하고, 네이티브 토큰 변경은 위 저장소 구독으로만 맞춘다.

  useEffect(() => {
    const controller = createWebShellBackController({
      dispatch(requestId, expiresAt) {
        // SPA/load events are not evidence that an overlay is absent. Query the
        // live document even while loading; only its explicit ACK may navigate.
        if (!webViewRef.current) return false;
        webViewRef.current.injectJavaScript(
          createWebShellOverlayBackScript(requestId, expiresAt),
        );
        return true;
      },
      onUnresponsive() {
        ToastAndroid.show(
          '잠시 후 뒤로가기를 다시 눌러 주세요.',
          ToastAndroid.SHORT,
        );
      },
      onUnhandled() {
        if (isChatRoomOpenRef.current) {
          isChatRoomOpenRef.current = false;
          webViewRef.current?.injectJavaScript(
            createWebShellChatListNavigationScript(),
          );
          return;
        }

        if (canGoBackRef.current) {
          webViewRef.current?.goBack();
          return;
        }

        const now = Date.now();
        if (now - lastRootBackPressAt.current <= EXIT_CONFIRMATION_WINDOW_MS) {
          BackHandler.exitApp();
          return;
        }

        lastRootBackPressAt.current = now;
        ToastAndroid.show('한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
      },
    });
    backControllerRef.current = controller;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (leaveConfirmationOpenRef.current) return true;
        controller.press();
        return true;
      },
    );

    return () => {
      subscription.remove();
      controller.cancel();
      backControllerRef.current = null;
    };
  }, []);

  const openOutsideApp = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert('링크를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
    });
  }, []);

  const startNativeOAuth = useCallback(
    async (provider: MobileOAuthProvider) => {
      if (authenticatingProvider) {
        return;
      }

      oauthInFlightRef.current = true;
      setAuthenticatingProvider(provider);

      try {
        const tokens = await loginWithMobileOAuth(provider);
        await authenticate(tokens);
        updateNativeSession(tokens);
        webViewRef.current?.injectJavaScript(
          createWebShellAuthenticationCompletionScript(
            appBaseUrl,
            tokens,
            lastNonLoginUrlRef.current,
          ),
        );
        ToastAndroid.show('로그인되었습니다.', ToastAndroid.SHORT);
      } catch {
        Alert.alert(
          '로그인을 완료하지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      } finally {
        oauthInFlightRef.current = false;
        setAuthenticatingProvider(null);
      }
    },
    [appBaseUrl, authenticate, authenticatingProvider, updateNativeSession],
  );

  const handleNewWindow = useCallback(
    (url: string) => {
      const decision = classifyWebShellNavigation(appBaseUrl, url);

      if (decision.type === 'allow') {
        if (url === 'about:blank') return;

        webViewRef.current?.injectJavaScript(
          createWebShellSameOriginNavigationScript(appBaseUrl, url),
        );
        return;
      }

      if (decision.type === 'native-oauth') {
        void startNativeOAuth(decision.provider);
        return;
      }

      if (decision.type === 'unsupported-oauth') {
        Alert.alert(
          'Android에서 지원하지 않는 로그인입니다',
          '카카오 또는 네이버로 로그인해 주세요.',
        );
        return;
      }

      if (decision.type === 'external') {
        openOutsideApp(url);
      }
    },
    [appBaseUrl, openOutsideApp, startNativeOAuth],
  );

  const handleWebMessage = useCallback(
    (data: string, sourceUrl: string) => {
      if (!isTrustedWebShellMessageSource(appBaseUrl, sourceUrl)) {
        return;
      }

      const snapshot = parseWebShellSessionSnapshot(data);
      if (snapshot) {
        if (oauthInFlightRef.current || webLogoutInFlightRef.current) return;
        if (snapshot.tokens) {
          // 웹은 인증을 새로 시작하지 않는다. 이미 인증된 세션의 회전만 보관한다.
          if (nativeSessionTokensRef.current) {
            void storeAuthTokens(snapshot.tokens).catch(() => undefined);
          }
        } else if (nativeSessionTokensRef.current) {
          webLogoutInFlightRef.current = true;
          void logout().finally(() => { webLogoutInFlightRef.current = false; });
        }
        return;
      }

      const message = parseWebShellMessage(data);

      if (!message) {
        return;
      }

      if (message.type === 'overlay-back-result') {
        backControllerRef.current?.resolve(message.requestId, message.handled);
        return;
      }

      if (message.type === 'confirm-leave-trade') {
        backControllerRef.current?.resolve(message.requestId, true);
        if (leaveConfirmationOpenRef.current) return;
        leaveConfirmationOpenRef.current = true;
        const finish = (accepted: boolean) => {
          leaveConfirmationOpenRef.current = false;
          webViewRef.current?.injectJavaScript(
            createWebShellConfirmLeaveScript(message.requestId, accepted),
          );
        };
        Alert.alert(
          '작성 중인 글에서 나갈까요?',
          '지금 나가면 저장하지 않은 작성 내용이 사라집니다.',
          [
            { text: '계속 작성', style: 'cancel', onPress: () => finish(false) },
            { text: '나가기', style: 'destructive', onPress: () => finish(true) },
          ],
          { cancelable: true, onDismiss: () => finish(false) },
        );
        return;
      }

      if (message.type === 'auth-session-synced') {
        markWebSessionReady();
        return;
      }

      if (message.type === 'native-bridge-ready') {
        void refreshNativeSession();
        return;
      }

      if (message.type === 'chat-room-state') {
        isChatRoomOpenRef.current = message.isOpen;
        return;
      }

      if (message.type !== 'auth-refresh-token') {
        return;
      }

      // 구형 웹 브리지는 refresh만 보낸다. 과거 access와 섞어 echo하지 않고
      // 현재 문서에서 access/refresh 전체를 다시 읽어 동일한 경로로 처리한다.
      webViewRef.current?.injectJavaScript(createWebShellSessionSnapshotRequestScript());
    },
    [appBaseUrl, logout, markWebSessionReady, refreshNativeSession],
  );

  function retry() {
    backControllerRef.current?.cancel();
    setHasLoadError(false);
    canGoBackRef.current = false;
    webViewLoadedRef.current = false;
    clearWebSessionReadyFallback();
    pushNavigationQueueRef.current.markLoading();
    setReloadKey((current) => current + 1);
  }

  if (nativeSessionTokens === undefined) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>가치가챠를 준비하고 있어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasLoadError) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            가치가챠를 불러오지 못했어요
          </Text>
          <Text style={styles.errorDescription}>
            인터넷 연결을 확인한 뒤 다시 시도해 주세요.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <WebView
        key={reloadKey}
        ref={webViewRef}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        cacheEnabled
        domStorageEnabled
        geolocationEnabled
        injectedJavaScriptBeforeContentLoaded={createWebShellBootstrapScript(
          nativeSessionTokens,
        )}
        injectedJavaScript={createWebShellRuntimeScript()}
        javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled
        mixedContentMode="never"
        onError={() => setHasLoadError(true)}
        onHttpError={({ nativeEvent }) => {
          if (
            nativeEvent.statusCode >= 400 &&
            nativeEvent.url === topLevelUrlRef.current &&
            isTrustedWebShellMessageSource(appBaseUrl, nativeEvent.url)
          ) {
            setHasLoadError(true);
          }
        }}
        onLoadStart={() => {
          backControllerRef.current?.cancel();
          webViewLoadedRef.current = false;
          clearWebSessionReadyFallback();
          pushNavigationQueueRef.current.markLoading();
        }}
        onLoadEnd={() => {
          webViewLoadedRef.current = true;
          scheduleWebSessionReadyFallback();
          void refreshNativeSession();
        }}
        onMessage={({ nativeEvent }) =>
          handleWebMessage(nativeEvent.data, nativeEvent.url)
        }
        onOpenWindow={({ nativeEvent }) =>
          handleNewWindow(nativeEvent.targetUrl)
        }
        onNavigationStateChange={({ canGoBack, url }) => {
          if (url !== topLevelUrlRef.current) {
            backControllerRef.current?.cancel();
          }
          canGoBackRef.current = canGoBack;
          topLevelUrlRef.current = url;

          try {
            const candidate = new URL(url);
            if (!candidate.pathname.startsWith('/chat')) {
              isChatRoomOpenRef.current = false;
            }
            if (
              candidate.origin === new URL(appBaseUrl).origin &&
              candidate.pathname !== '/login' &&
              !candidate.pathname.startsWith('/api/v1/oauth/')
            ) {
              lastNonLoginUrlRef.current = candidate.toString();
            }
          } catch {}
        }}
        onShouldStartLoadWithRequest={({ url }) => {
          const decision = classifyWebShellNavigation(appBaseUrl, url);

          if (decision.type === 'allow') {
            return true;
          }

          if (decision.type === 'native-oauth') {
            void startNativeOAuth(decision.provider);
            return false;
          }

          if (decision.type === 'unsupported-oauth') {
            Alert.alert(
              'Android에서 지원하지 않는 로그인입니다',
              '카카오 또는 네이버로 로그인해 주세요.',
            );
            return false;
          }

          if (decision.type === 'external') {
            openOutsideApp(url);
          }

          return false;
        }}
        originWhitelist={[new URL(appBaseUrl).origin]}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>가치가챠를 불러오고 있어요.</Text>
          </View>
        )}
        setSupportMultipleWindows
        sharedCookiesEnabled={false}
        source={{ uri: appBaseUrl }}
        startInLoadingState
        thirdPartyCookiesEnabled={false}
      />

      {authenticatingProvider && (
        <View
          accessibilityLiveRegion="polite"
          style={[StyleSheet.absoluteFill, styles.authOverlay]}
        >
          <View style={styles.authCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.authText}>로그인을 완료하고 있어요.</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  errorDescription: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  retryButtonPressed: {
    opacity: 0.72,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  authOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  authCard: {
    minWidth: 220,
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  authText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
