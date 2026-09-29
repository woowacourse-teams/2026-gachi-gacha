/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/test/**',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  globals: {
    __APP_ENV__: 'test',
    __APP_VERSION__: 'test',
    __IS_DEV__: false,
    __KAKAO_MAP_KEY__: '',
    __POSTHOG_API_HOST__: '',
    __POSTHOG_API_KEY__: '',
    __POSTHOG_ENABLED__: false,
    __USE_MSW__: false,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(gif|jpe?g|png|svg|webp)$': '<rootDir>/src/test/fileMock.ts',
  },
  setupFiles: ['<rootDir>/src/test/polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.[cm]?[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(?:@open-draft\\+(?:deferred-promise|logger|until)|headers-polyfill|outvariant|rettime|strict-event-emitter|until-async)@)',
    'node_modules/(?!.pnpm|@open-draft/(?:deferred-promise|logger|until)|headers-polyfill|outvariant|rettime|strict-event-emitter|until-async)',
  ],
};
