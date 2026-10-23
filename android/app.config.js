const DEVELOPMENT_VARIANT = 'development';
const PRODUCTION_VARIANT = 'production';
const DEFAULT_APP_VERSION = '0.1.0';
const DEFAULT_ANDROID_VERSION_CODE = 1;
const MAX_ANDROID_VERSION_CODE = 2_100_000_000;

const PRODUCTION_BLOCKED_PERMISSIONS = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.VIBRATE',
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
      blockedPermissions:
        variant === PRODUCTION_VARIANT
          ? PRODUCTION_BLOCKED_PERMISSIONS
          : undefined,
      softwareKeyboardLayoutMode: 'resize',
      adaptiveIcon: {
        backgroundColor: '#68c4f3',
        foregroundImage: './assets/lucha-app-icon.png',
      },
      predictiveBackGestureEnabled: true,
    },
    plugins: [
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
      kakaoMapNativeAppKeyConfigured: Boolean(kakaoMapNativeAppKey),
      tradeFeaturesEnabled: variant === DEVELOPMENT_VARIANT,
    },
  };
}

module.exports = createConfig;
module.exports.DEFAULT_ANDROID_VERSION_CODE = DEFAULT_ANDROID_VERSION_CODE;
module.exports.DEFAULT_APP_VERSION = DEFAULT_APP_VERSION;
module.exports.PRODUCTION_BLOCKED_PERMISSIONS = PRODUCTION_BLOCKED_PERMISSIONS;
module.exports.resolveAndroidVersionCode = resolveAndroidVersionCode;
module.exports.resolveAppVersion = resolveAppVersion;
