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

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  previewHead: (head) =>
    kakaoMapKey
      ? `${head}\n<script id="kakao-map-sdk" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false"></script>`
      : head,
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
        __IS_DEV__: JSON.stringify(true),
      }),
    );

    return webpackConfig;
  },
};

export default config;
