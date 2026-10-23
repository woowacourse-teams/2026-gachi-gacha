const { withAppBuildGradle } = require('@expo/config-plugins');

const SIGNING_MARKER = 'def gachiUploadStoreFile';
const SIGNING_PROPERTIES = [
  'GACHI_UPLOAD_STORE_FILE',
  'GACHI_UPLOAD_STORE_PASSWORD',
  'GACHI_UPLOAD_KEY_ALIAS',
  'GACHI_UPLOAD_KEY_PASSWORD',
];

function addReleaseSigning(contents) {
  if (contents.includes(SIGNING_MARKER)) {
    return contents;
  }

  const androidBlock = /^android\s*\{/m;
  const signingConfigsBlock = /    signingConfigs \{\n        debug \{/;
  const debugReleaseSigning = /        release \{\n([\s\S]*?)            signingConfig signingConfigs\.debug/;

  if (!androidBlock.test(contents)) {
    throw new Error('Android Gradle android block was not found.');
  }
  if (!signingConfigsBlock.test(contents)) {
    throw new Error('Android Gradle signingConfigs block was not found.');
  }
  if (!debugReleaseSigning.test(contents)) {
    throw new Error('Android Gradle release debug signing fallback was not found.');
  }

  const signingProperties = `def gachiUploadStoreFile = findProperty('GACHI_UPLOAD_STORE_FILE')
def gachiUploadStorePassword = findProperty('GACHI_UPLOAD_STORE_PASSWORD')
def gachiUploadKeyAlias = findProperty('GACHI_UPLOAD_KEY_ALIAS')
def gachiUploadKeyPassword = findProperty('GACHI_UPLOAD_KEY_PASSWORD')
def gachiRequireUploadSigning = (findProperty('GACHI_REQUIRE_UPLOAD_SIGNING') ?: 'false').toBoolean()
def gachiHasUploadSigning = [
    gachiUploadStoreFile,
    gachiUploadStorePassword,
    gachiUploadKeyAlias,
    gachiUploadKeyPassword,
].every { value -> value != null && !value.toString().trim().isEmpty() }

if (gachiRequireUploadSigning && !gachiHasUploadSigning) {
    throw new GradleException('Google Play release requires all GACHI_UPLOAD_* signing properties.')
}

`;

  const releaseSigningConfig = `    signingConfigs {
        if (gachiHasUploadSigning) {
            release {
                storeFile file(gachiUploadStoreFile)
                storePassword gachiUploadStorePassword
                keyAlias gachiUploadKeyAlias
                keyPassword gachiUploadKeyPassword
            }
        }
        debug {`;

  return contents
    .replace(androidBlock, `${signingProperties}android {`)
    .replace(
      debugReleaseSigning,
      (_match, releaseBody) =>
        `        release {\n${releaseBody}            signingConfig gachiHasUploadSigning ? signingConfigs.release : signingConfigs.debug`,
    )
    .replace(signingConfigsBlock, releaseSigningConfig);
}

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error('Android release signing injection requires Groovy Gradle.');
    }

    gradleConfig.modResults.contents = addReleaseSigning(
      gradleConfig.modResults.contents,
    );
    return gradleConfig;
  });
}

module.exports = withAndroidReleaseSigning;
module.exports.SIGNING_MARKER = SIGNING_MARKER;
module.exports.SIGNING_PROPERTIES = SIGNING_PROPERTIES;
module.exports.addReleaseSigning = addReleaseSigning;
