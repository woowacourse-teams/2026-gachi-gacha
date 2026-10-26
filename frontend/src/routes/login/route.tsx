import { useEffect, useMemo, useState } from 'react';

import appleSignInLogo from '@/assets/apple-sign-in-logo-white.svg';
import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import kakaoLoginSymbol from '@/assets/kakao-login-symbol.svg';
import naverLoginSymbol from '@/assets/naver-login-symbol.png';
import {
  readLoginReturnPath,
  storeAuthReturnPath,
} from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import type { OAuthProvider } from '@/features/auth/oauthProviderType';
import {
  prepareAppleSignIn,
  signInWithApple,
} from '@/features/auth/signInWithApple';
import { markCurrentLandingTourAsSeen } from '@/features/onboarding/landingTourSeenStorage';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { replaceBrowserLocation } from '@/shared/browser/browserNavigation';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  Accent,
  AppleProviderLogo,
  AppleProviderButton,
  Brand,
  BrandLogo,
  BrandName,
  Card,
  ErrorMessage,
  Main,
  Page,
  PrivacyLink,
  PrivacyNote,
  ProviderIcon,
  ProviderLink,
  ProviderList,
  RetryButton,
  Title,
} from './route.styles';

const PROVIDERS = [
  {
    provider: 'kakao',
    label: '카카오로 로그인',
  },
  {
    provider: 'naver',
    label: '네이버로 로그인',
  },
] as const satisfies readonly {
  provider: OAuthProvider;
  label: string;
}[];

function ProviderBrandIcon({ provider }: { provider: 'kakao' | 'naver' }) {
  return (
    <ProviderIcon aria-hidden="true">
      <img
        src={provider === 'kakao' ? kakaoLoginSymbol : naverLoginSymbol}
        alt=""
      />
    </ProviderIcon>
  );
}

export function LoginRoute() {
  const { status, errorMessage, retry, authenticate } = useAuthSession();
  const [appleErrorMessage, setAppleErrorMessage] = useState<string | null>(
    null,
  );
  const [isAppleLoginPending, setIsAppleLoginPending] = useState(false);
  const [isAppleLoginReady, setIsAppleLoginReady] = useState(false);
  const returnPath = useMemo(
    () => readLoginReturnPath(window.location.search),
    [],
  );
  const isAccountDeletionFlow =
    new URL(returnPath, window.location.origin).pathname ===
    '/account-deletion';

  useEffect(() => {
    if (status === 'authenticated') {
      replaceBrowserLocation(returnPath);
    }
  }, [returnPath, status]);

  useEffect(() => {
    let isCurrent = true;

    void prepareAppleSignIn()
      .then(() => {
        if (isCurrent) {
          setIsAppleLoginReady(true);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setAppleErrorMessage(
            error instanceof Error
              ? error.message
              : 'Apple 로그인을 준비하지 못했습니다.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (status === 'loading' || status === 'authenticated') {
    return <PageLoadingFallback label="로그인 상태를 확인하고 있어요." />;
  }

  function prepareOAuthLogin(provider: OAuthProvider) {
    storeAuthReturnPath(returnPath);
    captureAnalyticsEvent('oauth_login_started', {
      provider,
      return_pathname: new URL(returnPath, window.location.origin).pathname,
    });
  }

  async function handleAppleLogin() {
    prepareOAuthLogin('apple');
    setAppleErrorMessage(null);
    setIsAppleLoginPending(true);

    try {
      const tokens = await signInWithApple();

      await authenticate(tokens);
      markCurrentLandingTourAsSeen();
      captureAnalyticsEvent('oauth_login_completed', {
        provider: 'apple',
        outcome: 'success',
      });
    } catch (error) {
      captureAnalyticsEvent('oauth_login_completed', {
        provider: 'apple',
        outcome: 'failure',
      });
      setAppleErrorMessage(
        error instanceof Error
          ? error.message
          : 'Apple 로그인을 완료하지 못했습니다.',
      );
      setIsAppleLoginPending(false);
      setIsAppleLoginReady(false);

      void prepareAppleSignIn()
        .then(() => setIsAppleLoginReady(true))
        .catch(() => undefined);
    }
  }

  return (
    <Page>
      <Main>
        <Card aria-labelledby="login-title">
          <Brand
            href="/trade"
            aria-label="GachiGacha 거래/교환으로 이동"
            onClick={() =>
              captureAnalyticsEvent('navigation_selected', {
                destination: 'brand',
                source: 'login_brand',
                is_authenticated: false,
              })
            }
          >
            <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
            <BrandName>GachiGacha</BrandName>
          </Brand>

          <Title id="login-title">
            {isAccountDeletionFlow ? (
              <>
                회원 탈퇴를 위한
                <br />
                <Accent>본인 확인</Accent>이 필요해요
              </>
            ) : (
              <>
                원하는 <Accent>가챠</Accent>,<br />
                <Accent>같이</Accent> 한번 찾아봐요!
              </>
            )}
          </Title>

          {status === 'error' && errorMessage && (
            <ErrorMessage role="alert">
              {errorMessage}
              <br />
              <RetryButton
                type="button"
                onClick={() => {
                  captureAnalyticsEvent('recovery_action_selected', {
                    feature: 'auth_session',
                  });
                  retry();
                }}
              >
                로그인 상태 다시 확인
              </RetryButton>
            </ErrorMessage>
          )}

          {appleErrorMessage && (
            <ErrorMessage role="alert">{appleErrorMessage}</ErrorMessage>
          )}

          <ProviderList aria-label="소셜 로그인">
            <AppleProviderButton
              type="button"
              aria-label={
                isAccountDeletionFlow ? 'Apple로 본인 확인' : 'Apple로 로그인'
              }
              data-apple-sign-in
              disabled={isAppleLoginPending || !isAppleLoginReady}
              onClick={() => void handleAppleLogin()}
            >
              <AppleProviderLogo
                src={appleSignInLogo}
                alt=""
                aria-hidden="true"
                width={31}
                height={44}
                data-apple-logo
              />
              <span>
                {isAppleLoginPending
                  ? 'Apple 로그인 중...'
                  : !isAppleLoginReady
                    ? 'Apple 로그인 준비 중...'
                    : isAccountDeletionFlow
                      ? 'Apple로 본인 확인'
                      : 'Apple로 로그인'}
              </span>
            </AppleProviderButton>
            {PROVIDERS.map(({ provider, label }) => (
              <ProviderLink
                key={provider}
                href={`/api/v1/oauth/${provider}`}
                aria-label={
                  isAccountDeletionFlow
                    ? `${provider === 'kakao' ? '카카오' : '네이버'}로 본인 확인`
                    : label
                }
                $provider={provider}
                onClick={() => prepareOAuthLogin(provider)}
              >
                <ProviderBrandIcon provider={provider} />
                <span>
                  {isAccountDeletionFlow
                    ? `${provider === 'kakao' ? '카카오' : '네이버'}로 본인 확인`
                    : label}
                </span>
              </ProviderLink>
            ))}
          </ProviderList>

          <PrivacyNote>
            {isAccountDeletionFlow
              ? '본인 확인 후 탈퇴 여부를 한 번 더 확인합니다.'
              : '로그인하면 '}
            {!isAccountDeletionFlow && (
              <>
                <PrivacyLink
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    captureAnalyticsEvent('account_menu_selected', {
                      target: 'privacy',
                      source: 'login',
                    })
                  }
                >
                  개인정보처리방침
                </PrivacyLink>
                에 동의한 것으로 간주합니다.
              </>
            )}
          </PrivacyNote>
        </Card>
      </Main>
    </Page>
  );
}
