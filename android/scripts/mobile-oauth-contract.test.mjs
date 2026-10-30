import assert from 'node:assert/strict';
import test from 'node:test';

import { MOBILE_OAUTH_PROVIDER_SETTINGS } from '../src/config/oauthProviderSettings.ts';
import { buildMobileOAuthAuthorizationUrl } from '../src/domains/auth/mobileOAuthAuthorization.ts';

test('네이버 모바일 로그인은 OIDC endpoint와 openid scope를 사용한다', () => {
  assert.deepEqual(MOBILE_OAUTH_PROVIDER_SETTINGS.naver, {
    authorizationEndpoint: 'https://nid.naver.com/oauth2/authorize',
    scope: 'openid',
  });
});

test('네이버 인가 요청은 PKCE S256, nonce, state, HTTPS callback을 포함한다', () => {
  const settings = MOBILE_OAUTH_PROVIDER_SETTINGS.naver;
  const authorizationUrl = new URL(
    buildMobileOAuthAuthorizationUrl({
      ...settings,
      callbackUrl:
        'https://dev.gachigacha.kro.kr/oauth/mobile/callback/naver',
      challenge: 'pkce-challenge',
      clientId: 'naver-public-client-id',
      nonce: 'single-use-nonce',
    }),
  );

  assert.equal(authorizationUrl.origin, 'https://nid.naver.com');
  assert.equal(authorizationUrl.pathname, '/oauth2/authorize');
  assert.deepEqual(
    Object.fromEntries(authorizationUrl.searchParams.entries()),
    {
      client_id: 'naver-public-client-id',
      code_challenge: 'pkce-challenge',
      code_challenge_method: 'S256',
      nonce: 'single-use-nonce',
      redirect_uri:
        'https://dev.gachigacha.kro.kr/oauth/mobile/callback/naver',
      response_type: 'code',
      scope: 'openid',
      state: 'single-use-nonce',
    },
  );
});
