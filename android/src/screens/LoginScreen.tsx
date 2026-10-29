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
import Svg, { Path } from 'react-native-svg';

import { getMobileOAuthProviderConfig } from '../config/oauth';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import type { MobileOAuthProvider } from '../domains/auth/authTypes';
import {
  loginWithMobileOAuth,
  MobileOAuthLoginError,
} from '../domains/auth/mobileOAuthLogin';
import { traceMobileOAuth } from '../domains/auth/oauthDiagnostics';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const PROVIDERS = [
  { label: '카카오로 시작하기', provider: 'kakao' },
  { label: '네이버로 시작하기', provider: 'naver' },
] as const satisfies readonly {
  label: string;
  provider: MobileOAuthProvider;
}[];

function ProviderIcon({ provider }: { provider: MobileOAuthProvider }) {
  if (provider === 'naver') {
    return <Text accessibilityElementsHidden style={styles.naverIcon}>N</Text>;
  }

  return (
    <Svg accessibilityElementsHidden height={24} viewBox="0 0 24 24" width={24}>
      <Path
        d="M12 4C6.9 4 3 7.1 3 11c0 2.5 1.6 4.7 4.1 5.9l-.8 3 3.5-2.2c.7.1 1.4.2 2.2.2 5.1 0 9-3.1 9-6.9S17.1 4 12 4Z"
        fill="#191919"
      />
    </Svg>
  );
}

function readLoginError(error: unknown): string {
  if (error instanceof MobileOAuthLoginError || error instanceof Error) {
    return error.message;
  }

  return '소셜 로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export function LoginScreen({ navigation }: Props) {
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

  const isAnyProviderConfigured = PROVIDERS.some(
    ({ provider }) => getMobileOAuthProviderConfig(provider) !== null,
  );

  return (
    <ScrollView
      contentContainerStyle={styles.page}
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
          {PROVIDERS.map(({ label, provider }) => {
            const isConfigured = getMobileOAuthProviderConfig(provider) !== null;
            const isActive = activeProvider === provider;
            const disabled = !isConfigured || activeProvider !== null;

            return (
              <Pressable
                accessibilityHint={
                  isConfigured
                    ? '시스템 브라우저에서 안전하게 로그인합니다.'
                    : 'OAuth 운영 설정이 연결된 빌드에서 사용할 수 있습니다.'
                }
                accessibilityLabel={label}
                accessibilityRole="button"
                accessibilityState={{ busy: isActive, disabled }}
                disabled={disabled}
                key={provider}
                onPress={() => void login(provider)}
                style={({ pressed }) => [
                  styles.providerButton,
                  provider === 'kakao'
                    ? styles.kakaoButton
                    : styles.naverButton,
                  disabled && styles.disabledButton,
                  pressed && styles.pressedButton,
                ]}
              >
                {isActive ? (
                  <ActivityIndicator
                    color={provider === 'kakao' ? '#191919' : '#ffffff'}
                  />
                ) : (
                  <ProviderIcon provider={provider} />
                )}
                <Text
                  style={[
                    styles.providerLabel,
                    provider === 'naver' && styles.naverLabel,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
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
    paddingVertical: 28,
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
  providerList: { width: '100%', marginTop: 42, gap: 10 },
  providerButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  kakaoButton: { borderColor: '#dbc600', backgroundColor: '#f1da19' },
  naverButton: { borderColor: '#009f49', backgroundColor: '#08b957' },
  disabledButton: { opacity: 0.45 },
  pressedButton: { transform: [{ scale: 0.99 }], opacity: 0.82 },
  providerLabel: { color: '#191919', fontSize: 16, fontWeight: '700' },
  naverLabel: { color: '#ffffff' },
  naverIcon: {
    width: 24,
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 24,
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
