import { CssExtractWebpackPlugin } from '@lynx-js/css-extract-webpack-plugin';

import { ReactWebpackPlugin } from '../../../../src';

/** @type {import('@rspack/core').Configuration} */
export default {
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        use: [
          {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  jsx: false,
                },
              },
            },
          },
          {
            loader: ReactWebpackPlugin.loaders.MAIN_THREAD,
            options: {
              enableRemoveCSSScope: false,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: CssExtractWebpackPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                namedExport: false,
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: false,
  },
  plugins: [
    new CssExtractWebpackPlugin({
      filename: 'webpack.bundle.css',
    }),
    new ReactWebpackPlugin(),
  ],
};
