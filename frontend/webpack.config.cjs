const path = require('node:path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

/** @type {import('webpack').ConfigurationFactory} */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';

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
          use: 'ts-loader',
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
    ],

    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
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
