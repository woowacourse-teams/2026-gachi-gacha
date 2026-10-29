import assert from 'node:assert/strict';
import test from 'node:test';

import { MOBILE_OAUTH_PROVIDERS } from '../src/domains/auth/authTypes.ts';
import {
  LOGIN_PROVIDER_ICON_SIZE,
  LOGIN_PROVIDER_ITEMS,
} from '../src/screens/loginProviderPresentation.ts';

test('Android 로그인 화면은 카카오와 네이버만 제공한다', () => {
  assert.deepEqual(
    LOGIN_PROVIDER_ITEMS.map(({ provider }) => provider),
    MOBILE_OAUTH_PROVIDERS,
  );
  assert.equal(
    LOGIN_PROVIDER_ITEMS.some(({ provider }) => provider === 'apple'),
    false,
  );
});

test('로그인 제공자는 웹 v1.6.0과 같은 이름과 원형 아이콘 크기를 사용한다', () => {
  assert.deepEqual(
    LOGIN_PROVIDER_ITEMS.map(({ accessibilityLabel, name }) => ({
      accessibilityLabel,
      name,
    })),
    [
      { accessibilityLabel: '카카오로 로그인', name: '카카오' },
      { accessibilityLabel: '네이버로 로그인', name: '네이버' },
    ],
  );
  assert.equal(LOGIN_PROVIDER_ICON_SIZE, 64);
});
