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
        url: 'https://dev.gachigacha.kro.kr/oauth/login/kakao?code=oauth-code#done',
      },
      user: {
        email: 'member@example.com',
        id: '42',
        username: '가챠러',
      },
    };

    expect(sanitizeErrorEvent(event)).toMatchObject({
      request: {
        method: 'GET',
        url: 'https://dev.gachigacha.kro.kr/oauth/login/kakao',
      },
      user: { id: '42' },
    });
    expect(sanitizeErrorEvent(event).request).not.toHaveProperty('cookies');
    expect(sanitizeErrorEvent(event).request).not.toHaveProperty('data');
    expect(sanitizeErrorEvent(event).request).not.toHaveProperty('headers');
    expect(sanitizeErrorEvent(event).request).not.toHaveProperty(
      'query_string',
    );
    expect(sanitizeErrorEvent(event).user).not.toHaveProperty('email');
    expect(sanitizeErrorEvent(event).user).not.toHaveProperty('username');
  });

  it('추가 컨텍스트의 민감한 키와 토큰 형태 문자열을 마스킹한다', () => {
    const event: ErrorEvent = {
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
        nested: {
          description: '사용자가 입력한 설명',
          safeValue: '공개 가능한 값',
        },
      },
    };

    expect(sanitizeErrorEvent(event).extra).toEqual({
      authorization: '[Filtered]',
      nested: {
        description: '[Filtered]',
        safeValue: '공개 가능한 값',
      },
    });
    expect(sanitizeErrorEvent(event).exception?.values?.[0]?.value).toBe(
      'Authorization: Bearer [Filtered] / [Filtered]',
    );
  });

  it('탐색 breadcrumb에는 경로만 남기고 인증 값을 제거한다', () => {
    const breadcrumb = sanitizeErrorBreadcrumb({
      category: 'navigation',
      data: {
        from: '/login?returnTo=%2Fmypage',
        to: '/oauth/login/kakao?code=oauth-code&state=oauth-state',
      },
      message: 'Authorization: Bearer secret-access-token',
    });

    expect(breadcrumb.data).toEqual({
      from: '/login',
      to: '/oauth/login/kakao',
    });
    expect(breadcrumb.message).toBe('Authorization: Bearer [Filtered]');
  });
});
