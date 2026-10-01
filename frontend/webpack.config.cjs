const fs = require('node:fs');
const path = require('node:path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const webpack = require('webpack');

const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const KAKAO_MAP_KEY = process.env.KAKAO_MAP_KEY;
const POSTHOG_ENABLED = process.env.POSTHOG_ENABLED === 'true';
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? '';
const POSTHOG_API_HOST =
  process.env.POSTHOG_API_HOST ?? 'https://us.i.posthog.com';
const SENTRY_ENABLED = process.env.SENTRY_ENABLED === 'true';
const SENTRY_DSN = process.env.SENTRY_DSN ?? '';
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? 'http://localhost:8080';
const { version: APP_VERSION } = require('./package.json');
const SENTRY_RELEASE = process.env.SENTRY_RELEASE ?? APP_VERSION;
const sentrySourceMapValues = [SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT];
const hasAnySentrySourceMapValue = sentrySourceMapValues.some(Boolean);
const hasAllSentrySourceMapValues = sentrySourceMapValues.every(Boolean);

if (!KAKAO_MAP_KEY) {
  throw new Error(
    'KAKAO_MAP_KEY가 없습니다. `cp .env.example .env` 후 카카오 JavaScript 앱키를 채워주세요.',
  );
}

if (POSTHOG_ENABLED && !POSTHOG_API_KEY) {
  throw new Error('POSTHOG_ENABLED가 true이지만 POSTHOG_API_KEY가 없습니다.');
}

if (SENTRY_ENABLED && !SENTRY_DSN) {
  throw new Error('SENTRY_ENABLED가 true이지만 SENTRY_DSN이 없습니다.');
}

if (hasAnySentrySourceMapValue && !hasAllSentrySourceMapValues) {
  throw new Error(
    'Sentry source map 업로드에는 SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT가 모두 필요합니다.',
  );
}

/** @type {import('webpack').ConfigurationFactory} */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';
  const appEnvironment =
    process.env.APP_ENV ?? (isProduction ? 'production' : 'development');
  const shouldUploadSentrySourceMaps =
    isProduction && SENTRY_ENABLED && hasAllSentrySourceMapValues;

  return {
    entry: path.resolve(__dirname, 'src/main.tsx'),

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'assets/js/[name].[contenthash:8].js',
      chunkFilename: 'assets/js/[name].[contenthash:8].chunk.js',
      publicPath: '/',
      clean: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              onlyCompileBundledFiles: true,
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|webp|svg)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 4 * 1024,
            },
          },
          generator: {
            filename: 'assets/images/[name].[contenthash:8][ext]',
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
      }),

      new webpack.DefinePlugin({
        __IS_DEV__: JSON.stringify(!isProduction),
        __KAKAO_MAP_KEY__: JSON.stringify(KAKAO_MAP_KEY),
        __USE_MSW__: JSON.stringify(
          !isProduction && process.env.MOCK_API === 'true',
        ),
        __POSTHOG_ENABLED__: JSON.stringify(POSTHOG_ENABLED),
        __POSTHOG_API_KEY__: JSON.stringify(POSTHOG_API_KEY),
        __POSTHOG_API_HOST__: JSON.stringify(POSTHOG_API_HOST),
        __SENTRY_ENABLED__: JSON.stringify(SENTRY_ENABLED),
        __SENTRY_DSN__: JSON.stringify(SENTRY_DSN),
        __SENTRY_RELEASE__: JSON.stringify(SENTRY_RELEASE),
        __APP_ENV__: JSON.stringify(appEnvironment),
        __APP_VERSION__: JSON.stringify(APP_VERSION),
      }),
      ...(shouldUploadSentrySourceMaps
        ? [
            sentryWebpackPlugin({
              authToken: SENTRY_AUTH_TOKEN,
              org: SENTRY_ORG,
              project: SENTRY_PROJECT,
              telemetry: false,
              release: {
                name: SENTRY_RELEASE,
                setCommits: false,
              },
              sourcemaps: {
                assets: './dist/assets/js/**/*',
                filesToDeleteAfterUpload: './dist/**/*.map',
              },
            }),
          ]
        : []),
    ],

    devtool: isProduction
      ? shouldUploadSentrySourceMaps
        ? 'hidden-source-map'
        : false
      : 'eval-cheap-module-source-map',

    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api'],
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
      ],
    },

    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
      },
    },

    performance: {
      hints: isProduction ? 'warning' : false,
    },
  };
};
