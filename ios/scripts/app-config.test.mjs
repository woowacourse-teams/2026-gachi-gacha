import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const createConfig = require('../app.config.js');
const originalVariant = process.env.APP_VARIANT;

test.after(() => {
  if (originalVariant === undefined) delete process.env.APP_VARIANT;
  else process.env.APP_VARIANT = originalVariant;
});

test('development uses the dev site and bundle ID', () => {
  process.env.APP_VARIANT = 'development';
  const config = createConfig({ config: {} });
  assert.equal(config.extra.webBaseUrl, 'https://dev.gachigacha.kro.kr');
  assert.equal(config.ios.bundleIdentifier, 'com.dev.gachigacha.app');
  assert.deepEqual(config.platforms, ['ios']);
});

test('production uses the production site and bundle ID', () => {
  process.env.APP_VARIANT = 'production';
  const config = createConfig({ config: {} });
  assert.equal(config.extra.webBaseUrl, 'https://gachigacha.kro.kr');
  assert.equal(config.ios.bundleIdentifier, 'com.gachigacha.app');
});

test('unknown variant fails rather than silently using production', () => {
  process.env.APP_VARIANT = 'staging';
  assert.throws(() => createConfig({ config: {} }), /APP_VARIANT/);
});
