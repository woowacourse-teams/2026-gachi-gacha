const {
  withAndroidManifest,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const KAKAO_MAP_KEY_METADATA_NAME =
  'com.gachigacha.android.KAKAO_MAP_NATIVE_APP_KEY';
const KAKAO_MAP_MAVEN_REPOSITORY =
  "maven { url 'https://devrepo.kakao.com/nexus/repository/kakaomap-releases/' }";

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

function addKakaoMapMavenRepository(contents) {
  if (contents.includes(KAKAO_MAP_MAVEN_REPOSITORY)) {
    return contents;
  }

  const repositoriesBlock = /allprojects\s*\{\s*repositories\s*\{/;
  if (!repositoriesBlock.test(contents)) {
    throw new Error('Android allprojects repositories block was not found.');
  }

  return contents.replace(
    repositoriesBlock,
    (match) => `${match}\n    ${KAKAO_MAP_MAVEN_REPOSITORY}`,
  );
}

function withKakaoMapsAndroid(config, { nativeAppKey = '' } = {}) {
  const configWithManifest = withAndroidManifest(config, (manifestConfig) => {
    manifestConfig.modResults = setKakaoMapKey(
      manifestConfig.modResults,
      nativeAppKey.trim(),
    );
    return manifestConfig;
  });

  return withProjectBuildGradle(configWithManifest, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error('Kakao Maps repository injection requires Groovy Gradle.');
    }

    gradleConfig.modResults.contents = addKakaoMapMavenRepository(
      gradleConfig.modResults.contents,
    );
    return gradleConfig;
  });
}

module.exports = withKakaoMapsAndroid;
module.exports.KAKAO_MAP_MAVEN_REPOSITORY = KAKAO_MAP_MAVEN_REPOSITORY;
module.exports.addKakaoMapMavenRepository = addKakaoMapMavenRepository;
module.exports.KAKAO_MAP_KEY_METADATA_NAME = KAKAO_MAP_KEY_METADATA_NAME;
module.exports.setKakaoMapKey = setKakaoMapKey;
