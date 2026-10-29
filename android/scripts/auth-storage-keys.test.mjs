import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTH_SESSION_KEY,
  PENDING_OAUTH_LOGIN_KEY,
  isValidSecureStoreKey,
} from '../src/domains/auth/authStorageKeys.ts';

test('인증 SecureStore 키는 Expo 허용 문자만 사용한다', () => {
  assert.equal(isValidSecureStoreKey(AUTH_SESSION_KEY), true);
  assert.equal(isValidSecureStoreKey(PENDING_OAUTH_LOGIN_KEY), true);
});

test('콜론이 포함된 기존 SecureStore 키 형식을 거부한다', () => {
  assert.equal(isValidSecureStoreKey('gachi-gacha:auth-session:v1'), false);
  assert.equal(
    isValidSecureStoreKey('gachi-gacha:pending-oauth-login:v1'),
    false,
  );
});
