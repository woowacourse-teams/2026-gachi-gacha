import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import {
  getPublicWebFeature,
  isAllowedPublicWebFeatureUrl,
  isPublicWebFeatureEntryUrl,
} from '../config/web';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicWebFeature'>;

export function PublicWebFeatureScreen({ navigation, route }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const feature = getPublicWebFeature(route.params.feature);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!canGoBack) {
          return;
        }

        event.preventDefault();
        webViewRef.current?.goBack();
      }),
    [canGoBack, navigation],
  );

  function openOutsideApp(url: string) {
    try {
      const { protocol } = new URL(url);
      if (!['https:', 'mailto:', 'tel:'].includes(protocol)) {
        return;
      }
    } catch {
      return;
    }

    void Linking.openURL(url).catch(() => {
      Alert.alert('링크를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
    });
  }

  function retry() {
    setHasLoadError(false);
    setCanGoBack(false);
    setReloadKey((current) => current + 1);
  }

  if (hasLoadError) {
    return (
      <View style={styles.stateContainer}>
        <Text accessibilityRole="header" style={styles.stateTitle}>
          페이지를 불러오지 못했어요
        </Text>
        <Text style={styles.stateDescription}>
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
    );
  }

  return (
    <WebView
      key={reloadKey}
      ref={webViewRef}
      allowsBackForwardNavigationGestures
      cacheEnabled
      incognito
      javaScriptCanOpenWindowsAutomatically={false}
      mixedContentMode="never"
      onError={() => setHasLoadError(true)}
      onHttpError={({ nativeEvent }) => {
        if (
          nativeEvent.statusCode >= 400 &&
          isPublicWebFeatureEntryUrl(route.params.feature, nativeEvent.url)
        ) {
          setHasLoadError(true);
        }
      }}
      onNavigationStateChange={({ canGoBack: nextCanGoBack }) => {
        setCanGoBack(nextCanGoBack);
      }}
      onShouldStartLoadWithRequest={({ url }) => {
        if (isAllowedPublicWebFeatureUrl(route.params.feature, url)) {
          return true;
        }

        openOutsideApp(url);
        return false;
      }}
      originWhitelist={['https://gachigacha.kro.kr']}
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{feature.title}을 불러오고 있어요.</Text>
        </View>
      )}
      setSupportMultipleWindows={false}
      sharedCookiesEnabled={false}
      source={{ uri: feature.url }}
      startInLoadingState
      thirdPartyCookiesEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  stateContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  stateDescription: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 46,
    marginTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryButtonPressed: { opacity: 0.72 },
  retryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
