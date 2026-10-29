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
  clearAuthTokens,
  readAuthTokens,
  updateStoredRefreshToken,
} from '../domains/auth/authTokenStorage';
import type { AuthTokens, MobileOAuthProvider } from '../domains/auth/authTypes';
import { loginWithMobileOAuth } from '../domains/auth/mobileOAuthLogin';
import {
  classifyWebShellNavigation,
  createWebShellBootstrapScript,
  createWebShellRuntimeScript,
  createWebShellSessionSyncScript,
  isTrustedWebShellMessageSource,
  parseWebShellMessage,
} from '../domains/webShell/webShellPolicy';
import { colors } from '../theme/colors';

const EXIT_CONFIRMATION_WINDOW_MS = 2_000;

export function WebAppShellScreen() {
  const appBaseUrl = getWebAppBaseUrl();
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const lastRootBackPressAt = useRef(0);
  const webViewLoadedRef = useRef(false);
  const topLevelUrlRef = useRef(appBaseUrl);
  const { authenticate, logout, status } = useAuthSession();
  const [nativeSessionTokens, setNativeSessionTokens] = useState<
    AuthTokens | null | undefined
  >(undefined);
  const [authenticatingProvider, setAuthenticatingProvider] =
    useState<MobileOAuthProvider | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refreshNativeSession = useCallback(async () => {
    const tokens = await readAuthTokens();
    setNativeSessionTokens(tokens);
  }, []);

  useEffect(() => {
    if (
      nativeSessionTokens === undefined ||
      status === 'loading' ||
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

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBackRef.current) {
          webViewRef.current?.goBack();
          return true;
        }

        const now = Date.now();
        if (now - lastRootBackPressAt.current <= EXIT_CONFIRMATION_WINDOW_MS) {
          BackHandler.exitApp();
          return true;
        }

        lastRootBackPressAt.current = now;
        ToastAndroid.show('한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
        return true;
      },
    );

    return () => subscription.remove();
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

      setAuthenticatingProvider(provider);

      try {
        const tokens = await loginWithMobileOAuth(provider);
        await authenticate(tokens);
        setNativeSessionTokens(tokens);
        ToastAndroid.show('로그인되었습니다.', ToastAndroid.SHORT);
      } catch {
        Alert.alert(
          '로그인을 완료하지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      } finally {
        setAuthenticatingProvider(null);
      }
    },
    [authenticate, authenticatingProvider],
  );

  const handleWebMessage = useCallback(
    (data: string, sourceUrl: string) => {
      if (!isTrustedWebShellMessageSource(appBaseUrl, sourceUrl)) {
        return;
      }

      const message = parseWebShellMessage(data);

      if (!message || message.type !== 'auth-refresh-token') {
        return;
      }

      if (message.token) {
        const refreshToken = message.token;
        void updateStoredRefreshToken(refreshToken);
        setNativeSessionTokens((current) =>
          current
            ? { ...current, refreshToken }
            : current,
        );
        return;
      }

      setNativeSessionTokens(null);
      void clearAuthTokens().then(() => logout());
    },
    [appBaseUrl, logout],
  );

  function retry() {
    setHasLoadError(false);
    canGoBackRef.current = false;
    webViewLoadedRef.current = false;
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
        onLoadEnd={() => {
          webViewLoadedRef.current = true;
          void refreshNativeSession();
        }}
        onMessage={({ nativeEvent }) =>
          handleWebMessage(nativeEvent.data, nativeEvent.url)
        }
        onNavigationStateChange={({ canGoBack, url }) => {
          canGoBackRef.current = canGoBack;
          topLevelUrlRef.current = url;
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
        setSupportMultipleWindows={false}
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
