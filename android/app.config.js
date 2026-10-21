const DEVELOPMENT_VARIANT = 'development';
const PRODUCTION_VARIANT = 'production';

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

/**
 * @param {import('expo/config').ConfigContext} context
 * @returns {import('expo/config').ExpoConfig}
 */
function createConfig({ config }) {
  const variant = resolveVariant(process.env.APP_VARIANT);
  const variantConfig = VARIANTS[variant];

  return {
    ...config,
    name: variantConfig.appName,
    slug: 'gachi-gacha-android',
    scheme: variantConfig.scheme,
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/lucha-app-icon.png',
    userInterfaceStyle: 'light',
    android: {
      package: variantConfig.applicationId,
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#68c4f3',
        foregroundImage: './assets/lucha-app-icon.png',
      },
      predictiveBackGestureEnabled: true,
    },
    extra: {
      appVariant: variant,
      apiBaseUrl: variantConfig.apiBaseUrl,
    },
  };
}

module.exports = createConfig;
