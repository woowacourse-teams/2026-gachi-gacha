import { describe, expect, it } from '@jest/globals';

import {
  ExpectedOAuthLoginError,
  parseOAuthLoginFragment,
} from './parseOAuthLoginFragment';

describe('백엔드 OAuth 로그인 리다이렉트', () => {
  it('해시에서 서비스 토큰을 읽는다', () => {
    expect(
      parseOAuthLoginFragment('#accessToken=access&refreshToken=refresh'),
    ).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('오류 코드가 있으면 로그인 실패로 처리한다', () => {
    expect(() => parseOAuthLoginFragment('#error=invalid_state')).toThrow(
      ExpectedOAuthLoginError,
    );
  });

  it('토큰이 모두 없으면 실패한다', () => {
    expect(() => parseOAuthLoginFragment('#accessToken=access')).toThrow(
      '소셜 로그인 결과가 올바르지 않습니다',
    );
  });
});
