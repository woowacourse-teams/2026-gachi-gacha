const { withAppBuildGradle } = require('@expo/config-plugins');

const EXIF_INTERFACE_VERSION = '1.4.2';
const EXIF_INTERFACE_MODULE = 'androidx.exifinterface:exifinterface';
const EXIF_INTERFACE_DEPENDENCY =
  `implementation("${EXIF_INTERFACE_MODULE}:${EXIF_INTERFACE_VERSION}")`;

function addExifInterfaceDependency(contents) {
  const existingDependency = new RegExp(
    `implementation\\s*\\(?["']${EXIF_INTERFACE_MODULE.replaceAll('.', '\\.')}:`,
  );

  if (existingDependency.test(contents)) {
    return contents;
  }

  const dependenciesBlock = /dependencies\s*\{/;
  if (!dependenciesBlock.test(contents)) {
    throw new Error('Android app dependencies block was not found.');
  }

  return contents.replace(
    dependenciesBlock,
    (match) => `${match}\n    ${EXIF_INTERFACE_DEPENDENCY}`,
  );
}

function withAndroidExifInterface(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error(
        'AndroidX ExifInterface dependency injection requires Groovy Gradle.',
      );
    }

    gradleConfig.modResults.contents = addExifInterfaceDependency(
      gradleConfig.modResults.contents,
    );
    return gradleConfig;
  });
}

module.exports = withAndroidExifInterface;
module.exports.EXIF_INTERFACE_DEPENDENCY = EXIF_INTERFACE_DEPENDENCY;
module.exports.EXIF_INTERFACE_MODULE = EXIF_INTERFACE_MODULE;
module.exports.EXIF_INTERFACE_VERSION = EXIF_INTERFACE_VERSION;
module.exports.addExifInterfaceDependency = addExifInterfaceDependency;
