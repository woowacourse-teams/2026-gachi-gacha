import type { StorybookConfig } from '@storybook/react-webpack5';

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

    return webpackConfig;
  },
};

export default config;
