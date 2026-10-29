import { afterEach, expect, jest, test } from '@jest/globals';

import { clearAuthTokens, storeAuthTokens } from './authTokenStorage';

const webViewWindow = window as Window & {
  ReactNativeWebView?: { postMessage: jest.Mock };
};

afterEach(() => {
  clearAuthTokens();
  delete webViewWindow.ReactNativeWebView;
});

test('일반 브라우저에는 네이티브 메시지를 보내지 않고 토큰을 저장한다', () => {
  storeAuthTokens({ accessToken: 'access', refreshToken: 'refresh' });
  expect(window.sessionStorage.getItem('gachi-gacha:refresh-token')).toBe(
    'refresh',
  );
});

test('WebView에서는 refresh token만 저장·삭제 메시지로 보낸다', () => {
  const postMessage = jest.fn();
  webViewWindow.ReactNativeWebView = { postMessage };

  storeAuthTokens({
    accessToken: 'access-secret',
    refreshToken: 'refresh-secret',
  });
  clearAuthTokens();

  expect(postMessage).toHaveBeenNthCalledWith(
    1,
    JSON.stringify({
      type: 'gachigacha:auth-refresh-token',
      token: 'refresh-secret',
    }),
  );
  expect(postMessage).toHaveBeenNthCalledWith(
    2,
    JSON.stringify({ type: 'gachigacha:auth-refresh-token', token: null }),
  );
  expect(postMessage.mock.calls.flat().join('')).not.toContain('access-secret');
});

test('브리지 실패가 웹 토큰 저장을 막지 않는다', () => {
  webViewWindow.ReactNativeWebView = {
    postMessage: jest.fn(() => {
      throw new Error('bridge unavailable');
    }),
  };

  expect(() =>
    storeAuthTokens({ accessToken: 'access', refreshToken: 'refresh' }),
  ).not.toThrow();
});
