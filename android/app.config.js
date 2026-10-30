const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const DEVELOPMENT_VARIANT = 'development';
const PRODUCTION_VARIANT = 'production';
const DEFAULT_APP_VERSION = '0.1.0';
const DEFAULT_ANDROID_VERSION_CODE = 1;
const MAX_ANDROID_VERSION_CODE = 2_100_000_000;

const WEBVIEW_LOCATION_PERMISSIONS = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
];

const PUSH_NOTIFICATION_PERMISSIONS = [
  'android.permission.POST_NOTIFICATIONS',
];

const ANDROID_APP_PERMISSIONS = [
  ...WEBVIEW_LOCATION_PERMISSIONS,
  ...PUSH_NOTIFICATION_PERMISSIONS,
];

const FIREBASE_CONFIG_FILES = {
  development: './firebase/development.google-services.json',
  production: './firebase/production.google-services.json',
};

const PUSH_NOTIFICATION_CHANNEL_ID = 'gachigacha-updates';

const PRODUCTION_BLOCKED_PERMISSIONS = [
  'android.permission.CAMERA',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

const VARIANTS = {
  development: {
    appName: '가치가챠 Dev',
    applicationId: 'com.dev.gachigacha.app',
    scheme: 'gachigacha-dev',
    apiBaseUrl: 'https://dev.gachigacha.kro.kr',
  },
  production: {
    appName: '가치가챠',
    applicationId: 'com.gachigacha.app',
    scheme: 'gachigacha',
    apiBaseUrl: 'https://gachigacha.kro.kr',
  },
};

function resolveVariant(value) {
  if (!value || value === DEVELOPMENT_VARIANT) {
    return DEVELOPMENT_VARIANT;
  }

  if (value === PRODUCTION_VARIANT) {
    return PRODUCTION_VARIANT;
  }

  throw new Error(
    `APP_VARIANT must be "${DEVELOPMENT_VARIANT}" or "${PRODUCTION_VARIANT}". Received: ${value}`,
  );
}

function resolveAppVersion(value) {
  const version = value?.trim() || DEFAULT_APP_VERSION;

  if (
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
      version,
    )
  ) {
    throw new Error(
      `APP_VERSION must be a semantic version such as "0.1.0". Received: ${value}`,
    );
  }

  return version;
}

function resolveAndroidVersionCode(value) {
  if (!value?.trim()) {
    return DEFAULT_ANDROID_VERSION_CODE;
  }

  const versionCode = Number(value);
  if (
    !Number.isSafeInteger(versionCode) ||
    versionCode < 1 ||
    versionCode > MAX_ANDROID_VERSION_CODE
  ) {
    throw new Error(
      `ANDROID_VERSION_CODE must be an integer between 1 and ${MAX_ANDROID_VERSION_CODE}. Received: ${value}`,
    );
  }

  return versionCode;
}

function resolveOptionalHttpsUrl(value, name) {
  const normalized = value?.trim().replace(/\/$/, '') ?? '';

  if (!normalized) {
    return '';
  }

  let url;

  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${name} must be an absolute HTTPS URL. Received: ${value}`);
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must be an HTTPS URL without credentials, port, query, or fragment. Received: ${value}`,
    );
  }

  return url.toString().replace(/\/$/, '');
}

function resolveBooleanFlag(value, defaultValue = true) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(
    `Boolean environment flag must be "true" or "false". Received: ${value}`,
  );
}

function readVariantEnvironmentValue(baseName, variant) {
  const suffix = variant === DEVELOPMENT_VARIANT ? 'DEV' : 'PROD';
  return process.env[`${baseName}_${suffix}`]?.trim() ?? '';
}

function createOAuthIntentFilters(callbackBaseUrl) {
  if (!callbackBaseUrl) {
    return undefined;
  }

  const callbackUrl = new URL(callbackBaseUrl);

  return [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'https',
          host: callbackUrl.hostname,
          pathPrefix: callbackUrl.pathname,
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ];
}

function resolveFirebaseConfig(variant, applicationId) {
  const relativePath = FIREBASE_CONFIG_FILES[variant];
  const absolutePath = path.join(__dirname, relativePath);

  if (!existsSync(absolutePath)) {
    return { configured: false, googleServicesFile: undefined };
  }

  let config;

  try {
    config = JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    throw new Error(`${relativePath} must be valid google-services.json JSON.`);
  }

  const clients = Array.isArray(config.client) ? config.client : [];
  const hasMatchingApplication = clients.some(
    (client) =>
      client?.client_info?.android_client_info?.package_name === applicationId,
  );

  if (!hasMatchingApplication) {
    throw new Error(
      `${relativePath} must contain Android package ${applicationId}.`,
    );
  }

  return { configured: true, googleServicesFile: relativePath };
}

/**
 * @param {import('expo/config').ConfigContext} context
 * @returns {import('expo/config').ExpoConfig}
 */
function createConfig({ config }) {
  const variant = resolveVariant(process.env.APP_VARIANT);
  const variantConfig = VARIANTS[variant];
  const version = resolveAppVersion(process.env.APP_VERSION);
  const versionCode = resolveAndroidVersionCode(
    process.env.ANDROID_VERSION_CODE,
  );
  const kakaoMapNativeAppKey = process.env[
    variant === DEVELOPMENT_VARIANT
      ? 'KAKAO_MAP_NATIVE_APP_KEY_DEV'
      : 'KAKAO_MAP_NATIVE_APP_KEY_PROD'
  ]?.trim();
  const memberReportEndpoint = process.env.ANDROID_MEMBER_REPORT_ENDPOINT?.trim() ?? '';
  const oauthCallbackBaseUrl = resolveOptionalHttpsUrl(
    readVariantEnvironmentValue('ANDROID_OAUTH_CALLBACK_BASE_URL', variant),
    'ANDROID_OAUTH_CALLBACK_BASE_URL',
  );
  const oauthClientIds = {
    kakao: readVariantEnvironmentValue('ANDROID_KAKAO_OAUTH_CLIENT_ID', variant),
    naver: readVariantEnvironmentValue('ANDROID_NAVER_OAUTH_CLIENT_ID', variant),
  };
  const webShellEnabled = resolveBooleanFlag(
    process.env.ANDROID_WEB_SHELL_ENABLED,
  );
  const firebase = resolveFirebaseConfig(
    variant,
    variantConfig.applicationId,
  );

  return {
    ...config,
    name: variantConfig.appName,
    slug: 'gachi-gacha-android',
    scheme: variantConfig.scheme,
    version,
    orientation: 'portrait',
    icon: './assets/lucha-app-icon.png',
    userInterfaceStyle: 'light',
    android: {
      package: variantConfig.applicationId,
      versionCode,
      permissions: ANDROID_APP_PERMISSIONS,
      googleServicesFile: firebase.googleServicesFile,
      blockedPermissions:
        variant === PRODUCTION_VARIANT
          ? PRODUCTION_BLOCKED_PERMISSIONS
          : undefined,
      softwareKeyboardLayoutMode: 'resize',
      intentFilters: createOAuthIntentFilters(oauthCallbackBaseUrl),
      adaptiveIcon: {
        backgroundColor: '#68c4f3',
        foregroundImage: './assets/lucha-app-icon.png',
      },
      predictiveBackGestureEnabled: true,
    },
    plugins: [
      [
        'expo-image-picker',
        { microphonePermission: false },
      ],
      [
        'expo-secure-store',
        { configureAndroidBackup: true },
      ],
      [
        'expo-notifications',
        {
          color: '#d93b54',
          defaultChannel: PUSH_NOTIFICATION_CHANNEL_ID,
        },
      ],
      'expo-web-browser',
      './plugins/withAndroidExifInterface',
      './plugins/withAndroidReleaseSigning',
      [
        './plugins/withKakaoMapsAndroid',
        { nativeAppKey: kakaoMapNativeAppKey ?? '' },
      ],
    ],
    extra: {
      appVariant: variant,
      apiBaseUrl: variantConfig.apiBaseUrl,
      webAppBaseUrl: variantConfig.apiBaseUrl,
      webShellEnabled,
      memberReportEndpoint,
      oauth: {
        callbackBaseUrl: oauthCallbackBaseUrl,
        clientIds: oauthClientIds,
      },
      kakaoMapNativeAppKeyConfigured: Boolean(kakaoMapNativeAppKey),
      pushNotificationsConfigured: firebase.configured,
      pushNotificationChannelId: PUSH_NOTIFICATION_CHANNEL_ID,
      tradeFeaturesEnabled: variant === DEVELOPMENT_VARIANT,
    },
  };
}

module.exports = createConfig;
module.exports.DEFAULT_ANDROID_VERSION_CODE = DEFAULT_ANDROID_VERSION_CODE;
module.exports.DEFAULT_APP_VERSION = DEFAULT_APP_VERSION;
module.exports.ANDROID_APP_PERMISSIONS = ANDROID_APP_PERMISSIONS;
module.exports.FIREBASE_CONFIG_FILES = FIREBASE_CONFIG_FILES;
module.exports.PRODUCTION_BLOCKED_PERMISSIONS = PRODUCTION_BLOCKED_PERMISSIONS;
module.exports.PUSH_NOTIFICATION_CHANNEL_ID = PUSH_NOTIFICATION_CHANNEL_ID;
module.exports.PUSH_NOTIFICATION_PERMISSIONS = PUSH_NOTIFICATION_PERMISSIONS;
module.exports.WEBVIEW_LOCATION_PERMISSIONS = WEBVIEW_LOCATION_PERMISSIONS;
module.exports.resolveFirebaseConfig = resolveFirebaseConfig;
module.exports.resolveAndroidVersionCode = resolveAndroidVersionCode;
module.exports.resolveAppVersion = resolveAppVersion;
module.exports.resolveBooleanFlag = resolveBooleanFlag;
module.exports.resolveOptionalHttpsUrl = resolveOptionalHttpsUrl;
