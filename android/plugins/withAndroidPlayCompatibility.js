const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

const MATERIAL_COMPONENTS_VERSION = '1.14.0';
const MATERIAL_COMPONENTS_MODULE = 'com.google.android.material:material';
const MATERIAL_COMPONENTS_DEPENDENCY =
  `implementation("${MATERIAL_COMPONENTS_MODULE}:${MATERIAL_COMPONENTS_VERSION}")`;
const RELEASE_OPTIMIZATION_PROPERTIES = [
  'android.enableMinifyInReleaseBuilds',
  'android.enableShrinkResourcesInReleaseBuilds',
];
const SCREEN_ORIENTATION_ATTRIBUTE = 'android:screenOrientation';

function addMaterialComponentsDependency(contents) {
  const escapedModule = MATERIAL_COMPONENTS_MODULE.replaceAll('.', '\\.');
  const existingDependency = new RegExp(
    `implementation\\s*\\(?["']${escapedModule}:[^"']+["']\\)?`,
  );

  if (existingDependency.test(contents)) {
    return contents.replace(existingDependency, MATERIAL_COMPONENTS_DEPENDENCY);
  }

  const dependenciesBlock = /dependencies\s*\{/;
  if (!dependenciesBlock.test(contents)) {
    throw new Error('Android app dependencies block was not found.');
  }

  return contents.replace(
    dependenciesBlock,
    (match) => `${match}\n    ${MATERIAL_COMPONENTS_DEPENDENCY}`,
  );
}

function removeOrientationRestriction(androidManifest) {
  const mainActivity =
    AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
  delete mainActivity.$[SCREEN_ORIENTATION_ATTRIBUTE];
  return androidManifest;
}

function setGradleProperty(properties, key, value) {
  const normalizedValue = String(value);
  const existingProperty = properties.find(
    (property) => property.type === 'property' && property.key === key,
  );

  if (existingProperty) {
    existingProperty.value = normalizedValue;
    return properties;
  }

  properties.push({
    type: 'property',
    key,
    value: normalizedValue,
  });
  return properties;
}

function setReleaseOptimization(properties, enabled) {
  for (const key of RELEASE_OPTIMIZATION_PROPERTIES) {
    setGradleProperty(properties, key, enabled);
  }

  return properties;
}

function withAndroidPlayCompatibility(
  config,
  { enableReleaseOptimization = false } = {},
) {
  config = withAndroidManifest(config, (manifestConfig) => {
    manifestConfig.modResults = removeOrientationRestriction(
      manifestConfig.modResults,
    );
    return manifestConfig;
  });

  config = withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error(
        'Android Play compatibility dependency injection requires Groovy Gradle.',
      );
    }

    gradleConfig.modResults.contents = addMaterialComponentsDependency(
      gradleConfig.modResults.contents,
    );
    return gradleConfig;
  });

  return withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = setReleaseOptimization(
      gradleConfig.modResults,
      enableReleaseOptimization,
    );
    return gradleConfig;
  });
}

module.exports = withAndroidPlayCompatibility;
module.exports.MATERIAL_COMPONENTS_DEPENDENCY = MATERIAL_COMPONENTS_DEPENDENCY;
module.exports.MATERIAL_COMPONENTS_MODULE = MATERIAL_COMPONENTS_MODULE;
module.exports.MATERIAL_COMPONENTS_VERSION = MATERIAL_COMPONENTS_VERSION;
module.exports.RELEASE_OPTIMIZATION_PROPERTIES = RELEASE_OPTIMIZATION_PROPERTIES;
module.exports.SCREEN_ORIENTATION_ATTRIBUTE = SCREEN_ORIENTATION_ATTRIBUTE;
module.exports.addMaterialComponentsDependency = addMaterialComponentsDependency;
module.exports.removeOrientationRestriction = removeOrientationRestriction;
module.exports.setGradleProperty = setGradleProperty;
module.exports.setReleaseOptimization = setReleaseOptimization;
