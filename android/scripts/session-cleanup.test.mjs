import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanupAndroidSession } from '../src/domains/auth/sessionCleanup.ts';

function createDeferred() {
  let reject;
  let resolve;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

test('원격 요청보다 로컬 인증과 FCM 토큰을 먼저 지운다', async () => {
  const events = [];
  const pushCleanup = createDeferred();
  const sessionCleanup = createDeferred();

  const cleanup = cleanupAndroidSession({
    clearAuthTokens: async () => {
      events.push('clear-auth');
    },
    clearStoredPushToken: async () => {
      events.push('clear-push');
    },
    logoutRemoteSession: async () => {
      events.push('remote-logout');
      await sessionCleanup.promise;
    },
    onLocalSessionCleared: () => {
      events.push('guest');
    },
    readAuthTokens: async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }),
    readStoredPushToken: async () => 'push-token',
    unregisterRemotePushToken: async () => {
      events.push('remote-push');
      await pushCleanup.promise;
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, [
    'clear-auth',
    'clear-push',
    'guest',
    'remote-push',
    'remote-logout',
  ]);

  pushCleanup.resolve();
  sessionCleanup.resolve();
  await cleanup;
});

test('저장값 조회와 원격 해제가 실패해도 로컬 세션을 비운다', async () => {
  const events = [];

  await assert.doesNotReject(() =>
    cleanupAndroidSession({
      clearAuthTokens: async () => {
        events.push('clear-auth');
      },
      clearStoredPushToken: async () => {
        events.push('clear-push');
      },
      logoutRemoteSession: async () => {
        throw new Error('remote logout failed');
      },
      onLocalSessionCleared: () => {
        events.push('guest');
      },
      readAuthTokens: async () => {
        throw new Error('secure store read failed');
      },
      readStoredPushToken: async () => 'push-token',
      unregisterRemotePushToken: async () => {
        throw new Error('remote push cleanup failed');
      },
    }),
  );

  assert.deepEqual(events, ['clear-auth', 'clear-push', 'guest']);
});

test('회원 탈퇴 뒤 원격 API가 실패해도 로컬 세션 정리를 완료한다', async () => {
  const events = [];

  await assert.doesNotReject(() =>
    cleanupAndroidSession({
      clearAuthTokens: async () => {
        events.push('clear-auth');
      },
      clearStoredPushToken: async () => {
        events.push('clear-push');
      },
      logoutRemoteSession: async () => {
        events.push('remote-logout');
        throw new Error('account already deleted');
      },
      onLocalSessionCleared: () => {
        events.push('guest');
      },
      readAuthTokens: async () => ({
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
      }),
      readStoredPushToken: async () => 'push-token',
      unregisterRemotePushToken: async () => {
        events.push('remote-push');
        throw new Error('account already deleted');
      },
    }),
  );

  assert.deepEqual(events, [
    'clear-auth',
    'clear-push',
    'guest',
    'remote-push',
    'remote-logout',
  ]);
});
