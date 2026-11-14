import { describe, expect, it } from '@jest/globals';
import type { ErrorEvent } from '@sentry/react';

import {
  sanitizeErrorBreadcrumb,
  sanitizeErrorEvent,
} from './sanitizeErrorEvent';

describe('Sentry 오류 정보 마스킹', () => {
  it('요청의 쿼리·헤더·쿠키·본문과 사용자 개인정보를 제거한다', () => {
    const event: ErrorEvent = {
      type: undefined,
      request: {
        cookies: { session: 'secret-cookie' },
        data: { content: '사용자가 입력한 내용' },
        headers: { Authorization: 'Bearer secret-access-token' },
        method: 'GET',
        query_string: 'code=oauth-code',
        url: 'https://dev.gachigacha.kro.kr/oauth/callback?code=oauth-code#done',
      },
      user: { email: 'member@example.com', id: '42', username: '가챠러' },
    };

    const result = sanitizeErrorEvent(event);
    expect(result).toMatchObject({
      request: {
        method: 'GET',
        url: 'https://dev.gachigacha.kro.kr/oauth/callback',
      },
      user: { id: '42' },
    });
    expect(result.request).not.toHaveProperty('cookies');
    expect(result.request).not.toHaveProperty('data');
    expect(result.request).not.toHaveProperty('headers');
    expect(result.request).not.toHaveProperty('query_string');
    expect(result.user).not.toHaveProperty('email');
    expect(result.user).not.toHaveProperty('username');
  });

  it('추가 컨텍스트의 민감한 키와 토큰 문자열을 마스킹한다', () => {
    const result = sanitizeErrorEvent({
      type: undefined,
      exception: {
        values: [
          {
            type: 'Error',
            value:
              'Authorization: Bearer secret-access-token / eyJhbGciOiJIUzI1NiJ9.payload.signature',
          },
        ],
      },
      extra: {
        authorization: 'Bearer secret-access-token',
        nested: { description: '사용자 입력', safeValue: '공개 값' },
      },
    });
    expect(result.extra).toEqual({
      authorization: '[Filtered]',
      nested: { description: '[Filtered]', safeValue: '공개 값' },
    });
    expect(result.exception?.values?.[0]?.value).toBe(
      'Authorization: Bearer [Filtered] / [Filtered]',
    );
  });

  it('탐색 breadcrumb에는 경로만 남긴다', () => {
    const result = sanitizeErrorBreadcrumb({
      category: 'navigation',
      data: {
        from: '/login?returnTo=%2Fmypage',
        to: '/oauth/callback?code=oauth-code&state=oauth-state',
      },
      message: 'Authorization: Bearer secret-access-token',
    });
    expect(result.data).toEqual({ from: '/login', to: '/oauth/callback' });
    expect(result.message).toBe('Authorization: Bearer [Filtered]');
  });
});
