import { describe, expect, it } from '@jest/globals';

import {
  isOAuthCallbackPath,
  parseOAuthCallbackProvider,
} from './oauthCallbackPath';

describe('OAuth callback 경로', () => {
  it.each([
    ['/oauth/login/kakao', 'kakao'],
    ['/oauth/login/naver', 'naver'],
  ] as const)('%s에서 소셜 로그인 제공자를 읽는다', (pathname, provider) => {
    expect(parseOAuthCallbackProvider(pathname)).toBe(provider);
  });

  it.each([
    '/',
    '/oauth/login',
    '/oauth/login/google',
    '/oauth/login/kakao/',
    '/oauth/login/kakao/extra',
    '/oauth/login-kakao',
  ])('%s는 지원하는 callback 경로로 해석하지 않는다', (pathname) => {
    expect(parseOAuthCallbackProvider(pathname)).toBeNull();
  });

  it.each([
    ['/oauth/login', true],
    ['/oauth/login/kakao', true],
    ['/oauth/login/naver', true],
    ['/oauth/loginkakao', false],
    ['/login', false],
  ] as const)('%s의 인증 흐름 여부를 판별한다', (pathname, expected) => {
    expect(isOAuthCallbackPath(pathname)).toBe(expected);
  });
});
