import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const createConfig = require('../app.config.js');
const PLAY_STORE_ICON_MAX_BYTES = 1024 * 1024;

const expectedVariants = {
  development: {
    name: '가치가챠 Dev',
    package: 'com.dev.gachigacha.app',
    scheme: 'gachigacha-dev',
  },
  production: {
    name: '가치가챠',
    package: 'com.gachigacha.app',
    scheme: 'gachigacha',
  },
};

for (const [variant, expected] of Object.entries(expectedVariants)) {
  process.env.APP_VARIANT = variant;
  const config = createConfig({ config: {} });
  const actual = {
    name: config.name,
    package: config.android?.package,
    scheme: config.scheme,
    icon: config.icon,
    adaptiveForegroundImage: config.android?.adaptiveIcon?.foregroundImage,
  };

  const expectedConfig = {
    ...expected,
    icon: './assets/lucha-app-icon.png',
    adaptiveForegroundImage: './assets/lucha-app-icon.png',
  };

  if (JSON.stringify(actual) !== JSON.stringify(expectedConfig)) {
    throw new Error(
      `${variant} config mismatch. Expected ${JSON.stringify(expectedConfig)}, received ${JSON.stringify(actual)}`,
    );
  }

  console.log(`✓ ${variant}: ${actual.package}`);
}

const playStoreIcon = readFileSync(
  new URL('../assets/play-store-icon.png', import.meta.url),
);
const playStoreIconWidth = playStoreIcon.readUInt32BE(16);
const playStoreIconHeight = playStoreIcon.readUInt32BE(20);
const playStoreIconColorType = playStoreIcon.readUInt8(25);

if (
  playStoreIconWidth !== 512 ||
  playStoreIconHeight !== 512 ||
  playStoreIcon.length > PLAY_STORE_ICON_MAX_BYTES ||
  playStoreIconColorType !== 6
) {
  throw new Error(
    'Play Store icon must be a 512x512 32-bit RGBA PNG no larger than 1,024KB.',
  );
}

console.log(`✓ Play Store icon: 512x512 RGBA, ${playStoreIcon.length} bytes`);
