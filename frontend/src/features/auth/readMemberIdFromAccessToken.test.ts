import { describe, expect, it } from '@jest/globals';

import { readMemberIdFromAccessToken } from './readMemberIdFromAccessToken';

function createAccessToken(payload: object): string {
  const encodedPayload = globalThis
    .btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${encodedPayload}.signature`;
}

describe('JWT 회원 식별자 파싱', () => {
  it.each([
    [123, '123'],
    ['456', '456'],
  ])('memberId %p를 문자열 식별자로 반환한다', (memberId, expected) => {
    expect(readMemberIdFromAccessToken(createAccessToken({ memberId }))).toBe(
      expected,
    );
  });

  it.each([
    {},
    { memberId: null },
    { memberId: 0 },
    { memberId: -1 },
    { memberId: 1.5 },
    { memberId: Number.MAX_SAFE_INTEGER + 1 },
    { memberId: '' },
    { memberId: '001' },
    { memberId: 'member-1' },
  ])('유효하지 않은 payload %p에서는 식별자를 반환하지 않는다', (payload) => {
    expect(readMemberIdFromAccessToken(createAccessToken(payload))).toBeNull();
  });

  it.each(['', 'not-a-jwt', 'header.***.signature'])(
    '손상된 토큰 %p를 예외 없이 거부한다',
    (accessToken) => {
      expect(readMemberIdFromAccessToken(accessToken)).toBeNull();
    },
  );
});
