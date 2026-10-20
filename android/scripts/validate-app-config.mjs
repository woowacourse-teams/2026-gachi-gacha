import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const createConfig = require('../app.config.js');

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
  };

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${variant} config mismatch. Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }

  console.log(`✓ ${variant}: ${actual.package}`);
}
