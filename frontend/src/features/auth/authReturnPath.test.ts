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

  it('로그인 URL에 검증된 복귀 주소를 기록한다', () => {
    const loginUrl = createLoginUrl('/mypage?tab=stores#saved');

    expect(loginUrl).toBe('/login?returnTo=%2Fmypage%3Ftab%3Dstores%23saved');
    expect(
      readLoginReturnPath(new URL(loginUrl, window.location.origin).search),
    ).toBe('/mypage?tab=stores#saved');
  });
});
