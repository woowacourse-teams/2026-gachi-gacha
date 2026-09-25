import { useEffect, useState } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { exchangeOAuthCodeOnce } from '@/features/auth/api/exchangeOAuthCode';
import {
  consumeAuthReturnPath,
  createLoginUrl,
  peekAuthReturnPath,
} from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import type { OAuthProvider } from '@/features/auth/oauthProviderType';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  ActionLink,
  Card,
  Description,
  Logo,
  Page,
  SecondaryLink,
  Title,
} from './route.styles';

export interface AuthCallbackRouteProps {
  provider: OAuthProvider;
}

export function AuthCallbackRoute({ provider }: AuthCallbackRouteProps) {
  const { authenticate } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void exchangeOAuthCodeOnce(provider, window.location.search)
      .then(async (accessToken) => {
        if (!isCurrent) {
          return;
        }

        await authenticate(accessToken);

        if (isCurrent) {
          window.location.replace(consumeAuthReturnPath());
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
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
        <SecondaryLink href={returnPath}>로그인 없이 둘러보기</SecondaryLink>
      </Card>
    </Page>
  );
}
