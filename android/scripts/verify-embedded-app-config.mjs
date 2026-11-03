import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const EXPECTED_VARIANTS = {
  development: {
    applicationId: 'com.dev.gachigacha.app',
    scheme: 'gachigacha-dev',
    baseUrl: 'https://dev.gachigacha.kro.kr',
  },
  production: {
    applicationId: 'com.gachigacha.app',
    scheme: 'gachigacha',
    baseUrl: 'https://gachigacha.kro.kr',
  },
};

function readString(value) {
  return typeof value === 'string' ? value : '';
}

export function verifyEmbeddedAppConfig(config, variant) {
  const expected = EXPECTED_VARIANTS[variant];
  if (!expected) {
    throw new Error(
      `variant must be "development" or "production". Received: ${variant}`,
    );
  }

  const actual = {
    variant: readString(config?.extra?.appVariant),
    applicationId: readString(config?.android?.package),
    scheme: readString(config?.scheme),
    apiBaseUrl: readString(config?.extra?.apiBaseUrl),
    webAppBaseUrl: readString(config?.extra?.webAppBaseUrl),
    callbackBaseUrl: readString(config?.extra?.oauth?.callbackBaseUrl),
  };
  const expectedValues = {
    variant,
    applicationId: expected.applicationId,
    scheme: expected.scheme,
    apiBaseUrl: expected.baseUrl,
    webAppBaseUrl: expected.baseUrl,
    callbackBaseUrl: `${expected.baseUrl}/oauth/mobile/callback`,
  };

  const mismatches = Object.entries(expectedValues).filter(
    ([key, expectedValue]) => actual[key] !== expectedValue,
  );
  if (mismatches.length > 0) {
    const details = mismatches
      .map(
        ([key, expectedValue]) =>
          `${key}: expected ${JSON.stringify(expectedValue)}, received ${JSON.stringify(actual[key])}`,
      )
      .join('\n');
    throw new Error(
      `Embedded Expo config does not match the ${variant} build:\n${details}`,
    );
  }

  return actual;
}

async function main() {
  const [configPath, variant] = process.argv.slice(2);
  if (!configPath || !variant) {
    throw new Error(
      'Usage: node scripts/verify-embedded-app-config.mjs <app.config path> <development|production>',
    );
  }

  const raw = await readFile(configPath, 'utf8');
  const config = JSON.parse(raw);
  const verified = verifyEmbeddedAppConfig(config, variant);
  console.log(
    `Verified embedded ${verified.variant} config for ${verified.applicationId} (${verified.webAppBaseUrl}).`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
