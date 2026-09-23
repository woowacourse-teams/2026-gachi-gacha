import fs from 'node:fs';
import path from 'node:path';

import type { StorybookConfig } from '@storybook/react-webpack5';
import webpack from 'webpack';

const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const kakaoMapKey = process.env.KAKAO_MAP_KEY;
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8'),
) as { version: string };

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (webpackConfig) => {
    webpackConfig.module ??= { rules: [] };
    webpackConfig.module.rules ??= [];
    webpackConfig.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    });

    webpackConfig.resolve ??= {};
    webpackConfig.resolve.extensions = [
      ...(webpackConfig.resolve.extensions ?? []),
      '.ts',
      '.tsx',
    ];
    webpackConfig.resolve.alias = {
      ...(typeof webpackConfig.resolve.alias === 'object'
        ? webpackConfig.resolve.alias
        : {}),
      '@': path.resolve(rootDir, 'src'),
    };

    webpackConfig.plugins ??= [];
    webpackConfig.plugins.push(
      new webpack.DefinePlugin({
        __APP_ENV__: JSON.stringify('storybook'),
        __APP_VERSION__: JSON.stringify(packageJson.version),
        __IS_DEV__: JSON.stringify(true),
        __KAKAO_MAP_KEY__: JSON.stringify(kakaoMapKey ?? ''),
        __POSTHOG_API_HOST__: JSON.stringify(''),
        __POSTHOG_API_KEY__: JSON.stringify(''),
        __POSTHOG_ENABLED__: JSON.stringify(false),
      }),
    );

    return webpackConfig;
  },
};

export default config;
