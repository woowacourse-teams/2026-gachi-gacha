import { afterEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import {
  parseNativePushOpened,
  parseNativePushToken,
  registerNativePushToken,
  resetRegisteredPushTokenForTest,
  unregisterNativePushToken,
} from './nativePushBridge';

const TOKENS = {
  accessToken: 'push-access-token',
  refreshToken: 'push-refresh-token',
};

describe('nativePushBridge', () => {
  afterEach(() => {
    clearAuthTokens();
    resetRegisteredPushTokenForTest();
  });

  it('앱이 보낸 토큰과 플랫폼만 받는다', () => {
    expect(parseNativePushToken({ token: ' fcm ', platform: 'IOS' })).toEqual({
      token: 'fcm',
      platform: 'IOS',
    });
    expect(parseNativePushToken({ token: '', platform: 'IOS' })).toBeNull();
    expect(parseNativePushToken({ token: 'fcm', platform: 'WEB' })).toBeNull();
    expect(parseNativePushToken(null)).toBeNull();
  });

  it('알림 열기 이벤트에서 양의 정수 알림 ID만 읽는다', () => {
    expect(parseNativePushOpened({ notificationId: 7 })).toEqual({
      notificationId: 7,
    });
    expect(parseNativePushOpened({ notificationId: null })).toEqual({
      notificationId: null,
    });
    expect(parseNativePushOpened('x')).toBeNull();
  });

  it('인증 헤더와 함께 푸시 토큰을 등록한다', async () => {
    let authorization: string | null = null;
    let body: unknown = null;

    server.use(
      http.put('/api/v1/push-tokens', async ({ request }) => {
        authorization = request.headers.get('Authorization');
        body = await request.json();
        return HttpResponse.json({ code: 'C001', message: 'ok', data: null });
      }),
    );
    storeAuthTokens(TOKENS);

    await registerNativePushToken({ token: 'fcm-token', platform: 'IOS' });

    expect(authorization).toBe('Bearer push-access-token');
    expect(body).toEqual({ token: 'fcm-token', platform: 'IOS' });
  });

  it('호출 직후 로그인 토큰을 지워도 등록했던 푸시 토큰 삭제 요청에는 인증 헤더가 실린다', async () => {
    let authorization: string | null = null;
    let deletedBody: unknown = null;

    server.use(
      http.put('/api/v1/push-tokens', () =>
        HttpResponse.json({ code: 'C001', message: 'ok', data: null }),
      ),
      http.delete('/api/v1/push-tokens', async ({ request }) => {
        authorization = request.headers.get('Authorization');
        deletedBody = await request.json();
        return HttpResponse.json({ code: 'C003', message: 'ok', data: null });
      }),
    );
    storeAuthTokens(TOKENS);
    await registerNativePushToken({ token: 'fcm-token', platform: 'IOS' });

    const unregistering = unregisterNativePushToken();
    clearAuthTokens();
    await unregistering;

    expect(authorization).toBe('Bearer push-access-token');
    expect(deletedBody).toEqual({ token: 'fcm-token' });
  });

  it('등록한 토큰이 없으면 삭제 요청을 보내지 않는다', async () => {
    await expect(unregisterNativePushToken()).resolves.toBeUndefined();
  });
});
