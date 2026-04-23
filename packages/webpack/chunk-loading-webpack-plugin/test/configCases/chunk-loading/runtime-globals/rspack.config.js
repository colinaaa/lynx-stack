// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { RuntimeGlobals } from '@lynx-js/webpack-runtime-globals';

import { ChunkLoadingWebpackPlugin } from '../../../../lib/index.js';

/** @type {import('webpack').Configuration} */
export default {
  mode: 'development',
  output: {
    chunkLoading: 'lynx',
    chunkFormat: 'commonjs',
    chunkFilename: '[id].rspack.bundle.cjs',
  },
  plugins: [
    new ChunkLoadingWebpackPlugin(),
    /**
     * @param {import('webpack').Compiler} compiler
     */
    compiler => {
      new compiler.webpack.HotModuleReplacementPlugin().apply(compiler);
      const { RuntimeModule } = compiler.webpack;

      compiler.hooks.compilation.tap('test', compilation => {
        compilation.hooks.runtimeRequirementInTree.for(
          RuntimeGlobals.lynxAsyncChunkIds,
        ).tap('test', (chunk) => {
          compilation.addRuntimeModule(
            chunk,
            new LynxAsyncChunksRuntimeModule(),
          );
        });
      });

      class LynxAsyncChunksRuntimeModule extends RuntimeModule {
        constructor() {
          super('Lynx async chunks', RuntimeModule.STAGE_ATTACH);
        }

        /**
         * @override
         */
        generate() {
          const chunk = this.chunk;

          return `// lynx async chunks
    ${RuntimeGlobals.lynxAsyncChunkIds} = ${
            JSON.stringify(
              Object.fromEntries(
                Array.from(chunk.getAllAsyncChunks()).map(
                  c => [c.id, c.name],
                ),
              ),
            )
          }`;
        }
      }
    },
  ],
};
