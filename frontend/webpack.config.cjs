const fs = require('node:fs');
const path = require('node:path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
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
const EVENT_APPLICATION_ENABLED =
  process.env.EVENT_APPLICATION_ENABLED === 'true';
const AFFILIATE_CATALOG_ENABLED =
  process.env.AFFILIATE_CATALOG_ENABLED !== 'false';
const EVENT_APPLICATION_ENDPOINT = process.env.EVENT_APPLICATION_ENDPOINT ?? '';
const EVENT_APPLICATION_START_AT = process.env.EVENT_APPLICATION_START_AT ?? '';
const EVENT_APPLICATION_END_AT = process.env.EVENT_APPLICATION_END_AT ?? '';
const MEMBER_REPORT_ENDPOINT = process.env.MEMBER_REPORT_ENDPOINT ?? '';
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? 'http://localhost:8080';
const DEV_SERVER_PORT = Number(process.env.DEV_SERVER_PORT ?? 3000);
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
  console.warn(
    '[Sentry] source map 업로드 설정이 일부 누락되어 업로드 없이 빌드합니다.',
  );
}

/** @type {import('webpack').ConfigurationFactory} */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';
  const appEnvironment =
    process.env.APP_ENV ?? (isProduction ? 'production' : 'development');
  const isSearchIndexable = appEnvironment === 'production';
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
        searchEngineRobots: isSearchIndexable
          ? 'index,follow'
          : 'noindex,nofollow',
        exposeNaverSiteVerification: isSearchIndexable,
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(
              __dirname,
              isSearchIndexable
                ? 'public/robots.production.txt'
                : 'public/robots.non-production.txt',
            ),
            to: 'robots.txt',
          },
          {
            from: path.resolve(__dirname, 'public/sitemap.xml'),
            to: 'sitemap.xml',
          },
          {
            from: path.resolve(__dirname, 'public/og-image.png'),
            to: 'og-image.png',
          },
          {
            from: require.resolve('@fontsource/gaegu/files/gaegu-korean-400-normal.woff2'),
            to: 'assets/fonts/gaegu-korean-400-normal.woff2',
          },
          {
            from: require.resolve('@fontsource/gaegu/files/gaegu-korean-700-normal.woff2'),
            to: 'assets/fonts/gaegu-korean-700-normal.woff2',
          },
        ],
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
        __EVENT_APPLICATION_ENABLED__: JSON.stringify(
          EVENT_APPLICATION_ENABLED,
        ),
        __AFFILIATE_CATALOG_ENABLED__: JSON.stringify(
          AFFILIATE_CATALOG_ENABLED,
        ),
        __EVENT_APPLICATION_ENDPOINT__: JSON.stringify(
          EVENT_APPLICATION_ENDPOINT,
        ),
        __EVENT_APPLICATION_START_AT__: JSON.stringify(
          EVENT_APPLICATION_START_AT,
        ),
        __EVENT_APPLICATION_END_AT__: JSON.stringify(EVENT_APPLICATION_END_AT),
        __MEMBER_REPORT_ENDPOINT__: JSON.stringify(MEMBER_REPORT_ENDPOINT),
        __APP_ENV__: JSON.stringify(appEnvironment),
        __APP_VERSION__: JSON.stringify(APP_VERSION),
      }),

      ...(!AFFILIATE_CATALOG_ENABLED
        ? [
            new webpack.IgnorePlugin({
              resourceRegExp: /^\.\/AffiliateCatalogRuntime$/,
              contextRegExp: /features[\\/]affiliateCatalog$/,
            }),
          ]
        : []),
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
              errorHandler(error) {
                console.warn(
                  '[Sentry] source map 업로드에 실패했지만 서비스 빌드는 계속합니다.',
                  error,
                );
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
      port: DEV_SERVER_PORT,
      hot: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api'],
          target: API_PROXY_TARGET,
          changeOrigin: true,
          ws: true,
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
