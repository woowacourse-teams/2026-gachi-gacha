import { useEffect, useMemo } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import kakaoLoginButton from '@/features/auth/assets/kakao-login.svg';
import naverLoginButton from '@/features/auth/assets/naver-login.png';
import {
  readLoginReturnPath,
  storeAuthReturnPath,
} from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import type { OAuthProvider } from '@/features/auth/oauthProviderType';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import {
  BackLink,
  Brand,
  BrandLogo,
  Card,
  Description,
  ErrorMessage,
  Header,
  Main,
  Page,
  PrivacyNote,
  ProviderImage,
  ProviderLink,
  ProviderList,
  RetryButton,
  Title,
} from './route.styles';

const PROVIDERS = [
  {
    provider: 'kakao',
    label: '카카오 로그인',
    image: kakaoLoginButton,
  },
  {
    provider: 'naver',
    label: '네이버 로그인',
    image: naverLoginButton,
  },
] as const satisfies readonly {
  provider: OAuthProvider;
  label: string;
  image: string;
}[];

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
      <Header>
        <Brand href="/search" aria-label="GachiGacha 지도 검색으로 이동">
          <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
          <span>GachiGacha</span>
        </Brand>
      </Header>

      <Main>
        <Card aria-labelledby="login-title">
          <Title id="login-title">로그인</Title>
          <Description>
            관심 가챠와 교환 활동을 내 계정에서 이어서 관리해 보세요.
          </Description>

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
            {PROVIDERS.map(({ provider, label, image }) => (
              <ProviderLink
                key={provider}
                href={`/api/v1/oauth/${provider}`}
                aria-label={label}
                onClick={prepareOAuthLogin}
              >
                <ProviderImage src={image} alt="" aria-hidden="true" />
              </ProviderLink>
            ))}
          </ProviderList>

          <PrivacyNote>
            소셜 계정은 본인 확인에 사용하며 비밀번호는 저장하지 않아요.
          </PrivacyNote>
          <BackLink href={returnPath}>로그인 없이 둘러보기</BackLink>
        </Card>
      </Main>
    </Page>
  );
}
