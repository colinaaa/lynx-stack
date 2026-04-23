// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { rspack } from '@rspack/core';

import { ChunkLoadingWebpackPlugin } from '../../../../lib/index.js';

/** @type {import('@rspack/core').Configuration} */
export default {
  mode: 'development',
  output: {
    chunkLoading: 'require',
    chunkFormat: 'commonjs',
    chunkFilename: '[id].rspack.bundle.cjs',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },
  experiments: {
    css: false,
  },
  plugins: [
    new ChunkLoadingWebpackPlugin(),
    compiler => {
      new compiler.webpack.HotModuleReplacementPlugin().apply(compiler);
      new rspack.CssExtractRspackPlugin({
        chunkFilename: '[id].rspack.bundle.css',
      }).apply(compiler);
    },
  ],
};
