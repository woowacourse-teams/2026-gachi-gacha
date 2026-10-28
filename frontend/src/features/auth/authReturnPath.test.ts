import { describe, expect, it } from '@jest/globals';

import {
  createLoginUrl,
  normalizeAuthReturnPath,
  readLoginReturnPath,
} from './authReturnPath';

describe('로그인 후 복귀 주소', () => {
  it.each([
    null,
    '',
    'mypage',
    '//external.example/path',
    'https://external.example/path',
    '/login',
    '/login?returnTo=%2Fmypage',
    '/oauth/login',
    '/oauth/login/kakao?code=authorization-code',
  ])('안전하지 않은 주소 %p는 기본 검색 화면으로 교체한다', (candidate) => {
    expect(normalizeAuthReturnPath(candidate)).toBe('/trade');
  });

  it('서비스 내부 경로의 쿼리와 해시를 그대로 유지한다', () => {
    expect(normalizeAuthReturnPath('/mypage?tab=stores#saved')).toBe(
      '/mypage?tab=stores#saved',
    );
  });

  it('복귀 경로의 인증 파라미터만 제거한다', () => {
    expect(
      normalizeAuthReturnPath('/trade?category=1&accessToken=secret#saved'),
    ).toBe('/trade?category=1#saved');
  });

  it('해시의 인증 파라미터를 로그인 복귀 주소에 포함하지 않는다', () => {
    expect(
      normalizeAuthReturnPath(
        '/trade#accessToken=secret&refreshToken=refresh-secret',
      ),
    ).toBe('/trade');
    expect(
      normalizeAuthReturnPath(
        '/trade#tab=comments&AccessToken=secret&refresh_token=refresh-secret',
      ),
    ).toBe('/trade#tab=comments');
  });

  it('로그인 URL에 검증된 복귀 주소를 기록한다', () => {
    const loginUrl = createLoginUrl('/mypage?tab=stores#saved');

    expect(loginUrl).toBe('/login?returnTo=%2Fmypage%3Ftab%3Dstores%23saved');
    expect(
      readLoginReturnPath(new URL(loginUrl, window.location.origin).search),
    ).toBe('/mypage?tab=stores#saved');
  });

  it('로그인 URL에 인증 토큰을 기록하지 않는다', () => {
    const loginUrl = createLoginUrl(
      '/trade#accessToken=secret&refreshToken=refresh-secret',
    );

    expect(loginUrl).toBe('/login?returnTo=%2Ftrade');
    expect(loginUrl).not.toContain('secret');
  });
});
