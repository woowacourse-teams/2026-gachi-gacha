const VARIANTS = {
  development: {
    name: '가치가챠 Dev',
    bundleIdentifier: 'com.dev.gachigacha.app',
    scheme: 'gachigacha-dev',
    webBaseUrl: 'https://dev.gachigacha.kro.kr',
  },
  production: {
    name: '가치가챠',
    bundleIdentifier: 'com.gachigacha.app',
    scheme: 'gachigacha',
    webBaseUrl: 'https://gachigacha.kro.kr',
  },
};

function resolveVariant(value = 'development') {
  if (Object.hasOwn(VARIANTS, value)) return value;
  throw new Error(`APP_VARIANT must be development or production. Received: ${value}`);
}

/** @param {import('expo/config').ConfigContext} context */
function createConfig({ config }) {
  const variant = resolveVariant(process.env.APP_VARIANT);
  const settings = VARIANTS[variant];

  return {
    ...config,
    name: settings.name,
    slug: 'gachi-gacha-ios',
    scheme: settings.scheme,
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    platforms: ['ios'],
    ios: {
      bundleIdentifier: settings.bundleIdentifier,
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: '교환글에 올릴 사진을 촬영하기 위해 카메라를 사용합니다.',
        NSPhotoLibraryUsageDescription: '교환글에 올릴 사진을 선택하기 위해 사진 보관함을 사용합니다.',
      },
    },
    extra: {
      appVariant: variant,
      webBaseUrl: settings.webBaseUrl,
    },
  };
}

module.exports = createConfig;
module.exports.resolveVariant = resolveVariant;
