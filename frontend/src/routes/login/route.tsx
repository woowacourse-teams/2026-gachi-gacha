import { useEffect, useMemo } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import {
  readLoginReturnPath,
  storeAuthReturnPath,
} from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import type { OAuthProvider } from '@/features/auth/oauthProviderType';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  Accent,
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
    label: '카카오로 시작하기',
  },
  {
    provider: 'naver',
    label: '네이버로 시작하기',
  },
] as const satisfies readonly {
  provider: OAuthProvider;
  label: string;
}[];

function ProviderBrandIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'naver') {
    return <ProviderIcon aria-hidden="true">N</ProviderIcon>;
  }

  return (
    <ProviderIcon aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4C6.9 4 3 7.1 3 11c0 2.5 1.6 4.7 4.1 5.9l-.8 3 3.5-2.2c.7.1 1.4.2 2.2.2 5.1 0 9-3.1 9-6.9S17.1 4 12 4Z"
          fill="currentColor"
        />
      </svg>
    </ProviderIcon>
  );
}

export function LoginRoute() {
  const { status, errorMessage, retry } = useAuthSession();
  const returnPath = useMemo(
    () => readLoginReturnPath(window.location.search),
    [],
  );

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.replace(returnPath);
    }
  }, [returnPath, status]);

  if (status === 'loading' || status === 'authenticated') {
    return <PageLoadingFallback label="로그인 상태를 확인하고 있어요." />;
  }

  function prepareOAuthLogin() {
    storeAuthReturnPath(returnPath);
  }

  return (
    <Page>
      <Main>
        <Card aria-labelledby="login-title">
          <Brand href="/search" aria-label="GachiGacha 지도 검색으로 이동">
            <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
            <BrandName>GachiGacha</BrandName>
          </Brand>

          <Title id="login-title">
            원하는 <Accent>가챠</Accent>,<br />
            <Accent>같이</Accent> 한번 찾아봐요!
          </Title>

          {status === 'error' && errorMessage && (
            <ErrorMessage role="alert">
              {errorMessage}
              <br />
              <RetryButton type="button" onClick={retry}>
                로그인 상태 다시 확인
              </RetryButton>
            </ErrorMessage>
          )}

          <ProviderList aria-label="소셜 로그인">
            {PROVIDERS.map(({ provider, label }) => (
              <ProviderLink
                key={provider}
                href={`/api/v1/oauth/${provider}`}
                aria-label={label}
                $provider={provider}
                onClick={prepareOAuthLogin}
              >
                <ProviderBrandIcon provider={provider} />
                <span>{label}</span>
              </ProviderLink>
            ))}
          </ProviderList>

          <PrivacyNote>
            로그인하면{' '}
            <PrivacyLink href="/privacy" target="_blank" rel="noreferrer">
              개인정보처리방침
            </PrivacyLink>
            에 동의한 것으로 간주합니다.
          </PrivacyNote>
        </Card>
      </Main>
    </Page>
  );
}
