import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const createConfig = require('../app.config.js');
const {
  DEFAULT_ANDROID_VERSION_CODE,
  DEFAULT_APP_VERSION,
  ANDROID_APP_PERMISSIONS,
  PUSH_NOTIFICATION_CHANNEL_ID,
  PUSH_NOTIFICATION_PERMISSIONS,
  PRODUCTION_BLOCKED_PERMISSIONS,
  resolveOptionalHttpsUrl,
} = createConfig;
const {
  KAKAO_MAP_MAVEN_REPOSITORY,
  KAKAO_MAP_KEY_METADATA_NAME,
  addKakaoMapMavenRepository,
  setKakaoMapKey,
} = require('../plugins/withKakaoMapsAndroid.js');
const {
  EXIF_INTERFACE_DEPENDENCY,
  EXIF_INTERFACE_MODULE,
  addExifInterfaceDependency,
} = require('../plugins/withAndroidExifInterface.js');
const {
  SIGNING_MARKER,
  SIGNING_PROPERTIES,
  addReleaseSigning,
} = require('../plugins/withAndroidReleaseSigning.js');
const PLAY_STORE_ICON_MAX_BYTES = 1024 * 1024;
const PLAY_FEATURE_GRAPHIC_MAX_BYTES = 15 * 1024 * 1024;

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
const originalAppVersion = process.env.APP_VERSION;
const originalAndroidVersionCode = process.env.ANDROID_VERSION_CODE;
const originalMemberReportEndpoint = process.env.ANDROID_MEMBER_REPORT_ENDPOINT;
const originalWebShellEnabled = process.env.ANDROID_WEB_SHELL_ENABLED;
const oauthEnvironmentNames = [
  'ANDROID_OAUTH_CALLBACK_BASE_URL_DEV',
  'ANDROID_OAUTH_CALLBACK_BASE_URL_PROD',
  'ANDROID_KAKAO_OAUTH_CLIENT_ID_DEV',
  'ANDROID_KAKAO_OAUTH_CLIENT_ID_PROD',
  'ANDROID_NAVER_OAUTH_CLIENT_ID_DEV',
  'ANDROID_NAVER_OAUTH_CLIENT_ID_PROD',
];
const originalOAuthEnvironment = Object.fromEntries(
  oauthEnvironmentNames.map((name) => [name, process.env[name]]),
);
delete process.env.KAKAO_MAP_NATIVE_APP_KEY_DEV;
delete process.env.KAKAO_MAP_NATIVE_APP_KEY_PROD;
delete process.env.APP_VERSION;
delete process.env.ANDROID_VERSION_CODE;
delete process.env.ANDROID_MEMBER_REPORT_ENDPOINT;
delete process.env.ANDROID_WEB_SHELL_ENABLED;
for (const name of oauthEnvironmentNames) {
  delete process.env[name];
}

for (const [variant, expected] of Object.entries(expectedVariants)) {
  process.env.APP_VARIANT = variant;
  const config = createConfig({ config: {} });
  const notificationPlugin = config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications',
  );
  const actual = {
    name: config.name,
    package: config.android?.package,
    scheme: config.scheme,
    icon: config.icon,
    adaptiveForegroundImage: config.android?.adaptiveIcon?.foregroundImage,
    softwareKeyboardLayoutMode: config.android?.softwareKeyboardLayoutMode,
    version: config.version,
    versionCode: config.android?.versionCode,
    permissions: config.android?.permissions,
    googleServicesFile: config.android?.googleServicesFile,
    blockedPermissions: config.android?.blockedPermissions,
    apiBaseUrl: config.extra?.apiBaseUrl,
    webAppBaseUrl: config.extra?.webAppBaseUrl,
    webShellEnabled: config.extra?.webShellEnabled,
    kakaoMapNativeAppKeyConfigured:
      config.extra?.kakaoMapNativeAppKeyConfigured,
    memberReportEndpoint: config.extra?.memberReportEndpoint,
    oauth: config.extra?.oauth,
    oauthIntentFilters: config.android?.intentFilters,
    pushNotificationsConfigured:
      config.extra?.pushNotificationsConfigured,
    pushNotificationChannelId:
      config.extra?.pushNotificationChannelId,
    notificationPlugin,
    tradeFeaturesEnabled: config.extra?.tradeFeaturesEnabled,
  };

  const expectedConfig = {
    name: expected.name,
    package: expected.package,
    scheme: expected.scheme,
    icon: './assets/lucha-app-icon.png',
    adaptiveForegroundImage: './assets/lucha-app-icon.png',
    softwareKeyboardLayoutMode: 'resize',
    version: DEFAULT_APP_VERSION,
    versionCode: DEFAULT_ANDROID_VERSION_CODE,
    permissions: ANDROID_APP_PERMISSIONS,
    googleServicesFile: undefined,
    blockedPermissions:
      variant === 'production' ? PRODUCTION_BLOCKED_PERMISSIONS : undefined,
    apiBaseUrl: expected.apiBaseUrl,
    webAppBaseUrl: expected.apiBaseUrl,
    webShellEnabled: true,
    kakaoMapNativeAppKeyConfigured: false,
    memberReportEndpoint: '',
    oauth: {
      callbackBaseUrl: '',
      clientIds: { kakao: '', naver: '' },
    },
    oauthIntentFilters: undefined,
    pushNotificationsConfigured: false,
    pushNotificationChannelId: PUSH_NOTIFICATION_CHANNEL_ID,
    notificationPlugin: [
      'expo-notifications',
      {
        color: '#d93b54',
        defaultChannel: PUSH_NOTIFICATION_CHANNEL_ID,
      },
    ],
    tradeFeaturesEnabled: variant === 'development',
  };

  if (JSON.stringify(actual) !== JSON.stringify(expectedConfig)) {
    throw new Error(
      `${variant} config mismatch. Expected ${JSON.stringify(expectedConfig)}, received ${JSON.stringify(actual)}`,
    );
  }

  console.log(`✓ ${variant}: ${actual.package}`);
}

const webAppShellSource = readFileSync(
  new URL('../src/screens/WebAppShellScreen.tsx', import.meta.url),
  'utf8',
);

if (!/\bgeolocationEnabled\b/.test(webAppShellSource)) {
  throw new Error('Android WebView geolocation must be enabled for the map location control.');
}

if (
  PRODUCTION_BLOCKED_PERMISSIONS.some((permission) =>
    ANDROID_APP_PERMISSIONS.includes(permission),
  )
) {
  throw new Error('Required Android permissions must not be blocked in production.');
}

if (
  !PUSH_NOTIFICATION_PERMISSIONS.includes(
    'android.permission.POST_NOTIFICATIONS',
  )
) {
  throw new Error('Android 13 notification permission must be declared.');
}

const pushNotificationHookSource = readFileSync(
  new URL('../src/domains/notification/usePushNotifications.ts', import.meta.url),
  'utf8',
);
const pushNotificationApiSource = readFileSync(
  new URL('../src/domains/notification/pushNotificationApi.ts', import.meta.url),
  'utf8',
);

if (
  !/getDevicePushTokenAsync/.test(pushNotificationHookSource) ||
  !/addNotificationResponseReceivedListener/.test(pushNotificationHookSource) ||
  !/\/api\/v1\/push-tokens/.test(pushNotificationApiSource)
) {
  throw new Error('Android FCM token registration and notification routing must remain connected.');
}

console.log('✓ Android WebView location and FCM notification permissions are declared');

process.env.APP_VARIANT = 'production';
process.env.APP_VERSION = '1.2.3';
process.env.ANDROID_VERSION_CODE = '42';
const versionedConfig = createConfig({ config: {} });
if (
  versionedConfig.version !== '1.2.3' ||
  versionedConfig.android?.versionCode !== 42
) {
  throw new Error('Release version overrides were not applied.');
}

console.log('✓ release versionName and versionCode are configurable');

process.env.ANDROID_WEB_SHELL_ENABLED = 'false';
process.env.APP_VARIANT = 'development';
const nativeFallbackConfig = createConfig({ config: {} });

if (nativeFallbackConfig.extra?.webShellEnabled !== false) {
  throw new Error('Android WebView shell fallback flag was not applied.');
}

process.env.ANDROID_WEB_SHELL_ENABLED = 'invalid';
if (!throws(() => createConfig({ config: {} }))) {
  throw new Error('Invalid ANDROID_WEB_SHELL_ENABLED must fail config generation.');
}

if (originalWebShellEnabled === undefined) {
  delete process.env.ANDROID_WEB_SHELL_ENABLED;
} else {
  process.env.ANDROID_WEB_SHELL_ENABLED = originalWebShellEnabled;
}

console.log('✓ Android WebView shell is enabled by default and can be rolled back');

process.env.APP_VERSION = 'not-a-version';
if (!throws(() => createConfig({ config: {} }))) {
  throw new Error('Invalid APP_VERSION must fail config generation.');
}
process.env.APP_VERSION = '1.2.3';
process.env.ANDROID_VERSION_CODE = '0';
if (!throws(() => createConfig({ config: {} }))) {
  throw new Error('Invalid ANDROID_VERSION_CODE must fail config generation.');
}

delete process.env.APP_VERSION;
delete process.env.ANDROID_VERSION_CODE;

function throws(callback) {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
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
if (originalAppVersion === undefined) {
  delete process.env.APP_VERSION;
} else {
  process.env.APP_VERSION = originalAppVersion;
}
if (originalAndroidVersionCode === undefined) {
  delete process.env.ANDROID_VERSION_CODE;
} else {
  process.env.ANDROID_VERSION_CODE = originalAndroidVersionCode;
}

process.env.ANDROID_MEMBER_REPORT_ENDPOINT = 'https://example.com/report';
process.env.APP_VARIANT = 'development';
const reportConfig = createConfig({ config: {} });

if (reportConfig.extra?.memberReportEndpoint !== 'https://example.com/report') {
  throw new Error('Android member report endpoint was not injected into the app config.');
}

if (originalMemberReportEndpoint === undefined) {
  delete process.env.ANDROID_MEMBER_REPORT_ENDPOINT;
} else {
  process.env.ANDROID_MEMBER_REPORT_ENDPOINT = originalMemberReportEndpoint;
}

console.log('✓ Android member report endpoint is injected at build time');

process.env.APP_VARIANT = 'development';
process.env.ANDROID_OAUTH_CALLBACK_BASE_URL_DEV =
  'https://dev.gachigacha.kro.kr/oauth/mobile/callback/';
process.env.ANDROID_KAKAO_OAUTH_CLIENT_ID_DEV = 'kakao-public-client';
process.env.ANDROID_NAVER_OAUTH_CLIENT_ID_DEV = 'naver-public-client';
const oauthConfig = createConfig({ config: {} });
const oauthExtra = oauthConfig.extra?.oauth;
const oauthIntentFilter = oauthConfig.android?.intentFilters?.[0];

if (
  oauthExtra?.callbackBaseUrl !==
    'https://dev.gachigacha.kro.kr/oauth/mobile/callback' ||
  oauthExtra?.clientIds?.kakao !== 'kakao-public-client' ||
  oauthExtra?.clientIds?.naver !== 'naver-public-client' ||
  oauthIntentFilter?.autoVerify !== true ||
  oauthIntentFilter?.data?.[0]?.scheme !== 'https' ||
  oauthIntentFilter?.data?.[0]?.host !== 'dev.gachigacha.kro.kr' ||
  oauthIntentFilter?.data?.[0]?.pathPrefix !== '/oauth/mobile/callback'
) {
  throw new Error('Android OAuth App Link config was not generated correctly.');
}

if (
  !throws(() => resolveOptionalHttpsUrl('gachigacha://oauth/callback', 'TEST')) ||
  !throws(() => resolveOptionalHttpsUrl('http://example.com/callback', 'TEST')) ||
  !throws(() => resolveOptionalHttpsUrl('https://example.com/callback?token=x', 'TEST'))
) {
  throw new Error('OAuth callback config must reject unsafe callback URLs.');
}

console.log('✓ Android OAuth uses optional verified HTTPS App Link config');

for (const name of oauthEnvironmentNames) {
  const original = originalOAuthEnvironment[name];
  if (original === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = original;
  }
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

const projectBuildGradle = `allprojects {
  repositories {
    google()
    mavenCentral()
  }
}`;
const projectBuildGradleWithKakao = addKakaoMapMavenRepository(projectBuildGradle);

if (
  !projectBuildGradleWithKakao.includes(KAKAO_MAP_MAVEN_REPOSITORY) ||
  addKakaoMapMavenRepository(projectBuildGradleWithKakao) !==
    projectBuildGradleWithKakao
) {
  throw new Error('Kakao Maps Maven repository must be added exactly once.');
}

console.log('✓ Kakao Maps Maven repository is added to the generated Android project');

const appBuildGradle = `android {
  namespace 'com.gachigacha.app'
}

dependencies {
  implementation("com.facebook.react:react-android")
}`;
const appBuildGradleWithExif = addExifInterfaceDependency(appBuildGradle);

if (
  !appBuildGradleWithExif.includes(EXIF_INTERFACE_DEPENDENCY) ||
  addExifInterfaceDependency(appBuildGradleWithExif) !==
    appBuildGradleWithExif ||
  appBuildGradleWithExif.split(EXIF_INTERFACE_MODULE).length !== 2
) {
  throw new Error(
    'AndroidX ExifInterface must be added exactly once to the generated app Gradle.',
  );
}

console.log(
  '✓ AndroidX ExifInterface is added once to the generated Android app runtime',
);

const releaseGradle = `def jscFlavor = 'io.github.react-native-community:jsc-android-intl:+'

android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.debug
        }
    }
}`;
const releaseGradleWithSigning = addReleaseSigning(releaseGradle);

if (
  !releaseGradleWithSigning.includes(SIGNING_MARKER) ||
  !releaseGradleWithSigning.includes('GACHI_REQUIRE_UPLOAD_SIGNING') ||
  !releaseGradleWithSigning.includes(
    'signingConfig gachiHasUploadSigning ? signingConfigs.release : signingConfigs.debug',
  ) ||
  !releaseGradleWithSigning.includes(
    `debug {
            storeFile file('debug.keystore')`,
  ) ||
  SIGNING_PROPERTIES.some(
    (property) => !releaseGradleWithSigning.includes(property),
  ) ||
  addReleaseSigning(releaseGradleWithSigning) !== releaseGradleWithSigning
) {
  throw new Error(
    'Google Play release signing must be injected exactly once with a debug preview fallback.',
  );
}

console.log('✓ Google Play release signing is injected without embedding credentials');

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

const playFeatureGraphic = readFileSync(
  new URL('../assets/play-feature-graphic.png', import.meta.url),
);
const playFeatureGraphicWidth = playFeatureGraphic.readUInt32BE(16);
const playFeatureGraphicHeight = playFeatureGraphic.readUInt32BE(20);
const playFeatureGraphicColorType = playFeatureGraphic.readUInt8(25);

if (
  playFeatureGraphicWidth !== 1024 ||
  playFeatureGraphicHeight !== 500 ||
  playFeatureGraphic.length > PLAY_FEATURE_GRAPHIC_MAX_BYTES ||
  playFeatureGraphicColorType !== 2
) {
  throw new Error(
    'Play feature graphic must be a 1024x500 RGB PNG without alpha and no larger than 15MB.',
  );
}

console.log(
  `✓ Play feature graphic: 1024x500 RGB, ${playFeatureGraphic.length} bytes`,
);
