import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { prepareAppleSignIn, signInWithApple } from './signInWithApple';

const ACCESS_TOKEN = 'apple-access-token';
const REFRESH_TOKEN = 'apple-refresh-token';
const STATE = 'server-issued-state';
const NONCE = 'server-issued-nonce';

afterEach(() => {
  delete window.AppleID;
});

describe('signInWithApple', () => {
  it('Apple JS 팝업 결과의 code·state·user를 백엔드로 전달한다', async () => {
    const init = jest.fn();
    const signIn = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      authorization: {
        code: 'apple-authorization-code',
        id_token: 'apple-id-token',
        state: STATE,
      },
      user: {
        email: 'private@example.com',
        name: { firstName: '가챠', lastName: '친구' },
      },
    });
    const requestedForms: URLSearchParams[] = [];

    window.AppleID = { auth: { init, signIn } };
    server.use(
      http.post('/api/v1/oauth/apple/prepare', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            clientId: 'com.gachigacha.web.dev',
            redirectUri:
              'https://dev.gachigacha.kro.kr/api/v1/oauth/login/apple',
            state: STATE,
            nonce: NONCE,
          },
        }),
      ),
      http.post('/api/v1/oauth/login/apple', async ({ request }) => {
        requestedForms.push(new URLSearchParams(await request.text()));

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            accessToken: ACCESS_TOKEN,
            refreshToken: REFRESH_TOKEN,
          },
        });
      }),
    );

    await prepareAppleSignIn();
    await expect(signInWithApple()).resolves.toEqual({
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
    });
    expect(init).toHaveBeenCalledWith({
      clientId: 'com.gachigacha.web.dev',
      scope: 'name email',
      redirectURI: 'https://dev.gachigacha.kro.kr/api/v1/oauth/login/apple',
      state: STATE,
      nonce: NONCE,
      usePopup: true,
    });
    const requestedForm = requestedForms[0];

    expect(requestedForm).toBeDefined();
    expect(requestedForm?.get('code')).toBe('apple-authorization-code');
    expect(requestedForm?.get('state')).toBe(STATE);
    expect(JSON.parse(requestedForm?.get('user') ?? '{}')).toEqual({
      email: 'private@example.com',
      name: { firstName: '가챠', lastName: '친구' },
    });
  });

  it('백엔드가 발급한 state와 Apple 응답 state가 다르면 중단한다', async () => {
    window.AppleID = {
      auth: {
        init: jest.fn(),
        signIn: jest.fn<() => Promise<unknown>>().mockResolvedValue({
          authorization: {
            code: 'apple-authorization-code',
            id_token: 'apple-id-token',
            state: 'tampered-state',
          },
        }),
      },
    };
    server.use(
      http.post('/api/v1/oauth/apple/prepare', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            clientId: 'com.gachigacha.web.dev',
            redirectUri:
              'https://dev.gachigacha.kro.kr/api/v1/oauth/login/apple',
            state: STATE,
            nonce: NONCE,
          },
        }),
      ),
    );

    await prepareAppleSignIn();
    await expect(signInWithApple()).rejects.toThrow(
      'Apple 로그인 요청이 유효하지 않습니다.',
    );
  });
});
