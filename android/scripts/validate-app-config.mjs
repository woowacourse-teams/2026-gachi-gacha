import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const createConfig = require('../app.config.js');
const {
  KAKAO_MAP_KEY_METADATA_NAME,
  setKakaoMapKey,
} = require('../plugins/withKakaoMapsAndroid.js');
const PLAY_STORE_ICON_MAX_BYTES = 1024 * 1024;
const EXPECTED_ANDROID_PERMISSIONS = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
];

const expectedVariants = {
  development: {
    name: '가치가챠 Dev',
    package: 'com.dev.gachigacha.app',
    scheme: 'gachigacha-dev',
    apiBaseUrl: 'https://dev.gachigacha.kro.kr',
  },
  production: {
    name: '가치가챠',
    package: 'com.gachigacha.app',
    scheme: 'gachigacha',
    apiBaseUrl: 'https://gachigacha.kro.kr',
  },
};

const originalDevelopmentMapsKey = process.env.KAKAO_MAP_NATIVE_APP_KEY_DEV;
const originalProductionMapsKey = process.env.KAKAO_MAP_NATIVE_APP_KEY_PROD;
delete process.env.KAKAO_MAP_NATIVE_APP_KEY_DEV;
delete process.env.KAKAO_MAP_NATIVE_APP_KEY_PROD;

for (const [variant, expected] of Object.entries(expectedVariants)) {
  process.env.APP_VARIANT = variant;
  const config = createConfig({ config: {} });
  const actual = {
    name: config.name,
    package: config.android?.package,
    scheme: config.scheme,
    icon: config.icon,
    adaptiveForegroundImage: config.android?.adaptiveIcon?.foregroundImage,
    permissions: config.android?.permissions,
    apiBaseUrl: config.extra?.apiBaseUrl,
    kakaoMapNativeAppKeyConfigured:
      config.extra?.kakaoMapNativeAppKeyConfigured,
  };

  const expectedConfig = {
    name: expected.name,
    package: expected.package,
    scheme: expected.scheme,
    icon: './assets/lucha-app-icon.png',
    adaptiveForegroundImage: './assets/lucha-app-icon.png',
    permissions: EXPECTED_ANDROID_PERMISSIONS,
    apiBaseUrl: expected.apiBaseUrl,
    kakaoMapNativeAppKeyConfigured: false,
  };

  if (JSON.stringify(actual) !== JSON.stringify(expectedConfig)) {
    throw new Error(
      `${variant} config mismatch. Expected ${JSON.stringify(expectedConfig)}, received ${JSON.stringify(actual)}`,
    );
  }

  console.log(`✓ ${variant}: ${actual.package}`);
}

process.env.KAKAO_MAP_NATIVE_APP_KEY_DEV = 'development-test-key';
process.env.APP_VARIANT = 'development';
const mapsConfig = createConfig({ config: {} });

if (mapsConfig.extra?.kakaoMapNativeAppKeyConfigured !== true) {
  throw new Error('Kakao Map Native App Key was not applied to the development config.');
}

if (originalDevelopmentMapsKey === undefined) {
  delete process.env.KAKAO_MAP_NATIVE_APP_KEY_DEV;
} else {
  process.env.KAKAO_MAP_NATIVE_APP_KEY_DEV = originalDevelopmentMapsKey;
}
if (originalProductionMapsKey === undefined) {
  delete process.env.KAKAO_MAP_NATIVE_APP_KEY_PROD;
} else {
  process.env.KAKAO_MAP_NATIVE_APP_KEY_PROD = originalProductionMapsKey;
}

console.log('✓ Kakao Map key is injected without exposing it through public extras');

const testManifest = {
  manifest: {
    application: [{ $: {} }],
  },
};
setKakaoMapKey(testManifest, 'development-test-key');
const kakaoMapMetadata = testManifest.manifest.application[0]['meta-data'];

if (
  kakaoMapMetadata?.length !== 1 ||
  kakaoMapMetadata[0].$['android:name'] !== KAKAO_MAP_KEY_METADATA_NAME ||
  kakaoMapMetadata[0].$['android:value'] !== 'development-test-key'
) {
  throw new Error('Kakao Map Native App Key was not injected into AndroidManifest.xml.');
}

setKakaoMapKey(testManifest, '');
if (testManifest.manifest.application[0]['meta-data'].length !== 0) {
  throw new Error('Empty Kakao Map key must not remain in AndroidManifest.xml.');
}

console.log('✓ Kakao Map key is added only to the generated Android manifest');

const playStoreIcon = readFileSync(
  new URL('../assets/play-store-icon.png', import.meta.url),
);
const playStoreIconWidth = playStoreIcon.readUInt32BE(16);
const playStoreIconHeight = playStoreIcon.readUInt32BE(20);
const playStoreIconColorType = playStoreIcon.readUInt8(25);

if (
  playStoreIconWidth !== 512 ||
  playStoreIconHeight !== 512 ||
  playStoreIcon.length > PLAY_STORE_ICON_MAX_BYTES ||
  playStoreIconColorType !== 6
) {
  throw new Error(
    'Play Store icon must be a 512x512 32-bit RGBA PNG no larger than 1,024KB.',
  );
}

console.log(`✓ Play Store icon: 512x512 RGBA, ${playStoreIcon.length} bytes`);
