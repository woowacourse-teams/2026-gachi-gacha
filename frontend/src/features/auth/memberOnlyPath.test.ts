import { describe, expect, it } from '@jest/globals';

import { getLoginCloseTarget, isMemberOnlyPath } from './memberOnlyPath';

describe('isMemberOnlyPath', () => {
  it.each([
    '/trade/new',
    '/trade/12/edit',
    '/chat',
    '/chat/3',
    '/chat/start/9',
    '/notifications',
    '/mypage',
    '/mypage/trades',
    '/mypage/blocked-members',
    '/events/popular-goods',
  ])('%s는 회원 전용 화면이다', (pathname) => {
    expect(isMemberOnlyPath(pathname)).toBe(true);
  });

  it.each(['/trade', '/trade/12', '/map', '/stores/1', '/search', '/updates'])(
    '%s는 누구나 볼 수 있는 화면이다',
    (pathname) => {
      expect(isMemberOnlyPath(pathname)).toBe(false);
    },
  );
});

describe('getLoginCloseTarget', () => {
  it('누구나 볼 수 있는 화면이면 쿼리와 함께 그대로 돌아간다', () => {
    expect(getLoginCloseTarget('/trade/12?from=list')).toBe(
      '/trade/12?from=list',
    );
  });

  it('회원 전용 화면이면 홈으로 보낸다', () => {
    expect(getLoginCloseTarget('/mypage?tab=stores')).toBe('/trade');
    expect(getLoginCloseTarget('/chat/start/9')).toBe('/trade');
  });
});
