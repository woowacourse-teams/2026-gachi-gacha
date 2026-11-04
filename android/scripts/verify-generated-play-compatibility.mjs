import { readFileSync } from 'node:fs';

const variant = process.env.APP_VARIANT ?? 'development';
if (!['development', 'production'].includes(variant)) {
  throw new Error(
    `Unsupported APP_VARIANT for compatibility verification: ${variant}`,
  );
}

const manifest = readFileSync(
  new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
  'utf8',
);
const appBuildGradle = readFileSync(
  new URL('../android/app/build.gradle', import.meta.url),
  'utf8',
);
const gradleProperties = readFileSync(
  new URL('../android/gradle.properties', import.meta.url),
  'utf8',
);

if (/android:screenOrientation=/.test(manifest)) {
  throw new Error('Generated Android manifest must not lock screen orientation.');
}

if (/android:resizeableActivity=["']false["']/.test(manifest)) {
  throw new Error('Generated Android manifest must not disable activity resizing.');
}

if (!appBuildGradle.includes('com.google.android.material:material:1.14.0')) {
  throw new Error('Generated Android app must select Material Components 1.14.0.');
}

const expectedOptimization = variant === 'production' ? 'true' : 'false';
for (const key of [
  'android.enableMinifyInReleaseBuilds',
  'android.enableShrinkResourcesInReleaseBuilds',
]) {
  if (!gradleProperties.includes(`${key}=${expectedOptimization}`)) {
    throw new Error(
      `${key} must be ${expectedOptimization} for the ${variant} variant.`,
    );
  }
}

if (!gradleProperties.includes('edgeToEdgeEnabled=true')) {
  throw new Error('Generated Android project must keep edge-to-edge enabled.');
}

console.log('✓ generated manifest allows resizing and rotation');
console.log('✓ Material Components 1.14.0 is selected by the app');
console.log(
  `✓ ${variant} release optimization is ${expectedOptimization === 'true' ? 'enabled' : 'disabled'}`,
);
