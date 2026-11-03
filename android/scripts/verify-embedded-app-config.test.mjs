import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyEmbeddedAppConfig } from './verify-embedded-app-config.mjs';

function createConfig(variant) {
  const production = variant === 'production';
  const baseUrl = production
    ? 'https://gachigacha.kro.kr'
    : 'https://dev.gachigacha.kro.kr';

  return {
    scheme: production ? 'gachigacha' : 'gachigacha-dev',
    android: {
      package: production
        ? 'com.gachigacha.app'
        : 'com.dev.gachigacha.app',
    },
    extra: {
      appVariant: variant,
      apiBaseUrl: baseUrl,
      webAppBaseUrl: baseUrl,
      oauth: {
        callbackBaseUrl: `${baseUrl}/oauth/mobile/callback`,
      },
    },
  };
}

test('development embedded config를 허용한다', () => {
  assert.doesNotThrow(() =>
    verifyEmbeddedAppConfig(createConfig('development'), 'development'),
  );
});

test('production embedded config를 허용한다', () => {
  assert.doesNotThrow(() =>
    verifyEmbeddedAppConfig(createConfig('production'), 'production'),
  );
});

test('production APK에 development 번들이 포함되면 실패한다', () => {
  assert.throws(
    () =>
      verifyEmbeddedAppConfig(createConfig('development'), 'production'),
    /Embedded Expo config does not match the production build/,
  );
});
