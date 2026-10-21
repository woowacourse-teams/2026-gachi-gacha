const { withAndroidManifest } = require('@expo/config-plugins');

const KAKAO_MAP_KEY_METADATA_NAME =
  'com.gachigacha.android.KAKAO_MAP_NATIVE_APP_KEY';

function setKakaoMapKey(androidManifest, nativeAppKey) {
  const application = androidManifest.manifest.application?.[0];

  if (!application) {
    throw new Error('Android application manifest entry was not found.');
  }

  application['meta-data'] = (application['meta-data'] ?? []).filter(
    (entry) => entry.$?.['android:name'] !== KAKAO_MAP_KEY_METADATA_NAME,
  );

  if (nativeAppKey) {
    application['meta-data'].push({
      $: {
        'android:name': KAKAO_MAP_KEY_METADATA_NAME,
        'android:value': nativeAppKey,
      },
    });
  }

  return androidManifest;
}

function withKakaoMapsAndroid(config, { nativeAppKey = '' } = {}) {
  return withAndroidManifest(config, (configWithManifest) => {
    configWithManifest.modResults = setKakaoMapKey(
      configWithManifest.modResults,
      nativeAppKey.trim(),
    );
    return configWithManifest;
  });
}

module.exports = withKakaoMapsAndroid;
module.exports.KAKAO_MAP_KEY_METADATA_NAME = KAKAO_MAP_KEY_METADATA_NAME;
module.exports.setKakaoMapKey = setKakaoMapKey;
