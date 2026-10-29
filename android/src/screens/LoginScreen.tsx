import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { getMobileOAuthProviderConfig } from '../config/oauth';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import type { MobileOAuthProvider } from '../domains/auth/authTypes';
import {
  loginWithMobileOAuth,
  MobileOAuthLoginError,
} from '../domains/auth/mobileOAuthLogin';
import { traceMobileOAuth } from '../domains/auth/oauthDiagnostics';
import type { RootStackParamList } from '../navigation/RootStack';
import { useBottomContentPadding } from '../shared/useBottomContentPadding';
import { colors } from '../theme/colors';

import {
  LOGIN_PROVIDER_ICON_SIZE,
  LOGIN_PROVIDER_ITEMS,
} from './loginProviderPresentation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function ProviderIcon({ provider }: { provider: MobileOAuthProvider }) {
  if (provider === 'naver') {
    return (
      <View
        accessibilityElementsHidden
        style={[styles.providerIcon, styles.naverIconBackground]}
      >
        <Text style={styles.naverIcon}>N</Text>
      </View>
    );
  }

  return (
    <Svg
      accessibilityElementsHidden
      height={LOGIN_PROVIDER_ICON_SIZE}
      viewBox="0 0 48 48"
      width={LOGIN_PROVIDER_ICON_SIZE}
    >
      <Rect fill="#FEE500" height={48} rx={24} width={48} />
      <Path
        d="M24.0014 14C17.9241 14 13 18.0219 13 22.9825C13 26.1711 15.0368 28.9728 18.1057 30.5656L17.0681 34.5677C17.0295 34.6871 17.0598 34.8151 17.1424 34.9033C17.2029 34.9659 17.2855 35 17.3653 35C17.4341 35 17.5029 34.9772 17.5607 34.9289L22.0196 31.8171C22.661 31.911 23.3215 31.9622 23.9986 31.9622C30.0732 31.9622 35 27.9403 35 22.9797C35 18.0191 30.0759 14 24.0014 14Z"
        fill="#191919"
      />
    </Svg>
  );
}

function readLoginError(error: unknown): string {
  if (error instanceof MobileOAuthLoginError) {
    return error.message;
  }

  return '로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export function LoginScreen({ navigation }: Props) {
  const bottomContentPadding = useBottomContentPadding(28);
  const { authenticate, errorMessage, retry, status } = useAuthSession();
  const [activeProvider, setActiveProvider] =
    useState<MobileOAuthProvider | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, status]);

  async function login(provider: MobileOAuthProvider) {
    if (activeProvider) {
      return;
    }

    setActiveProvider(provider);
    setLoginError(null);

    try {
      const tokens = await loginWithMobileOAuth(provider);
      await authenticate(tokens);
      traceMobileOAuth(provider, 'session_authenticated', {
        source: 'active_session',
      });
    } catch (error) {
      setLoginError(readLoginError(error));
    } finally {
      setActiveProvider(null);
    }
  }

  const isAnyProviderConfigured = LOGIN_PROVIDER_ITEMS.some(
    ({ provider }) => getMobileOAuthProviderConfig(provider) !== null,
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingBottom: bottomContentPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View accessibilityLabel="GachiGacha" style={styles.brand}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={require('../../assets/gacha-logo.png')}
            style={styles.brandLogo}
          />
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={require('../../assets/gachigacha-wordmark.png')}
            style={styles.brandWordmark}
          />
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          원하는 <Text style={styles.accent}>가챠</Text>,{`\n`}
          <Text style={styles.accent}>같이</Text> 한번 찾아봐요!
        </Text>

        {(loginError || (status === 'error' && errorMessage)) && (
          <View accessibilityLiveRegion="polite" style={styles.errorCard}>
            <Text style={styles.errorText}>{loginError ?? errorMessage}</Text>
            {status === 'error' && !loginError && (
              <Pressable accessibilityRole="button" onPress={retry}>
                <Text style={styles.retryText}>로그인 상태 다시 확인</Text>
              </Pressable>
            )}
          </View>
        )}

        <View accessibilityLabel="소셜 로그인" style={styles.providerList}>
          {LOGIN_PROVIDER_ITEMS.map(
            ({ accessibilityLabel, name, provider }) => {
              const isConfigured =
                getMobileOAuthProviderConfig(provider) !== null;
              const isActive = activeProvider === provider;
              const interactionDisabled =
                !isConfigured || activeProvider !== null;
              const visuallyDisabled =
                !isConfigured || (activeProvider !== null && !isActive);

              return (
                <Pressable
                  accessibilityHint={
                    isConfigured
                      ? '시스템 브라우저에서 안전하게 로그인합니다.'
                      : 'OAuth 운영 설정이 연결된 빌드에서 사용할 수 있습니다.'
                  }
                  accessibilityLabel={accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{
                    busy: isActive,
                    disabled:
                      !isConfigured || (activeProvider !== null && !isActive),
                  }}
                  disabled={interactionDisabled}
                  key={provider}
                  onPress={() => void login(provider)}
                  style={({ pressed }) => [
                    styles.providerButton,
                    visuallyDisabled && styles.disabledButton,
                    pressed && styles.pressedButton,
                  ]}
                >
                  {isActive ? (
                    <View
                      style={[
                        styles.providerIcon,
                        provider === 'kakao'
                          ? styles.kakaoIconBackground
                          : styles.naverIconBackground,
                      ]}
                    >
                      <ActivityIndicator
                        color={provider === 'kakao' ? '#191919' : '#ffffff'}
                      />
                    </View>
                  ) : (
                    <ProviderIcon provider={provider} />
                  )}
                  <Text style={styles.providerLabel}>{name}</Text>
                </Pressable>
              );
            },
          )}
        </View>

        {!isAnyProviderConfigured && (
          <Text accessibilityLiveRegion="polite" style={styles.configurationNote}>
            소셜 로그인 연결을 준비하고 있어요. 지도와 가챠 검색은 로그인 없이
            이용할 수 있어요.
          </Text>
        )}

        <Text style={styles.privacyNote}>
          로그인하면{' '}
          <Text
            accessibilityRole="link"
            onPress={() =>
              navigation.navigate('PublicWebFeature', {
                feature: 'privacyPolicy',
              })
            }
            style={styles.privacyLink}
          >
            개인정보처리방침
          </Text>
          에 동의한 것으로 간주합니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.background,
    elevation: 3,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 38, height: 38 },
  brandWordmark: { width: 140, height: 23 },
  title: {
    marginTop: 42,
    color: colors.text,
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'center',
  },
  accent: { color: colors.primary },
  errorCard: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  providerList: {
    width: '100%',
    marginTop: 42,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 32,
  },
  providerButton: {
    width: LOGIN_PROVIDER_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  providerIcon: {
    width: LOGIN_PROVIDER_ICON_SIZE,
    height: LOGIN_PROVIDER_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LOGIN_PROVIDER_ICON_SIZE / 2,
  },
  kakaoIconBackground: { backgroundColor: '#FEE500' },
  naverIconBackground: { backgroundColor: '#03C75A' },
  disabledButton: { opacity: 0.45 },
  pressedButton: { transform: [{ translateY: -1 }], opacity: 0.82 },
  providerLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  naverIcon: {
    color: '#ffffff',
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 38,
    textAlign: 'center',
  },
  configurationNote: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  privacyNote: {
    marginTop: 22,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  privacyLink: {
    color: colors.text,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
