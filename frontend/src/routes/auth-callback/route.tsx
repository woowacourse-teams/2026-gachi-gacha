import { useEffect, useRef, useState } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { exchangeOAuthCodeOnce } from '@/features/auth/api/exchangeOAuthCode';
import {
  consumeAuthReturnPath,
  createLoginUrl,
  peekAuthReturnPath,
} from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import {
  clearOAuthLoginProvider,
  readOAuthLoginProvider,
} from '@/features/auth/oauthLoginProviderStorage';
import type { OAuthProvider } from '@/features/auth/oauthProviderType';
import { parseOAuthLoginFragment } from '@/features/auth/parseOAuthLoginFragment';
import { markCurrentLandingTourAsSeen } from '@/features/onboarding/landingTourSeenStorage';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { replaceBrowserLocation } from '@/shared/browser/browserNavigation';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  ActionLink,
  Card,
  Description,
  Logo,
  Page,
  Title,
} from './route.styles';

export interface AuthCallbackRouteProps {
  provider?: OAuthProvider;
}

export function AuthCallbackRoute({ provider }: AuthCallbackRouteProps) {
  const { authenticate } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectFragmentRef = useRef<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const completionProvider = provider ?? readOAuthLoginProvider();

    if (!provider && redirectFragmentRef.current === null) {
      redirectFragmentRef.current = window.location.hash;
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }

    const authTokensPromise = provider
      ? exchangeOAuthCodeOnce(provider, window.location.search)
      : Promise.resolve().then(() =>
          parseOAuthLoginFragment(redirectFragmentRef.current ?? ''),
        );

    void authTokensPromise
      .then(async (authTokens) => {
        if (!isCurrent) {
          return;
        }

        await authenticate(authTokens);

        if (isCurrent) {
          clearOAuthLoginProvider();
          markCurrentLandingTourAsSeen();
          if (completionProvider) {
            captureAnalyticsEvent('oauth_login_completed', {
              provider: completionProvider,
              outcome: 'success',
            });
          }
          replaceBrowserLocation(consumeAuthReturnPath());
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        clearOAuthLoginProvider();
        if (completionProvider) {
          captureAnalyticsEvent('oauth_login_completed', {
            provider: completionProvider,
            outcome: 'failure',
          });
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : '소셜 로그인을 완료하지 못했습니다.',
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [authenticate, provider]);

  if (!errorMessage) {
    return <PageLoadingFallback label="소셜 로그인을 완료하고 있어요." />;
  }

  const returnPath = peekAuthReturnPath();

  return (
    <Page>
      <Card role="alert">
        <Logo src={gachiGachaLogo} alt="" aria-hidden="true" />
        <Title>로그인을 완료하지 못했어요</Title>
        <Description>{errorMessage}</Description>
        <ActionLink href={createLoginUrl(returnPath)}>다시 로그인</ActionLink>
      </Card>
    </Page>
  );
}
