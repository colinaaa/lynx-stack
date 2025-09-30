// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import path from 'node:path';

import {
  ECompilerType,
  describeByWalk,
  readConfigFile,
} from '@rspack/test-tools';
import type {
  ITestContext,
  ITestEnv,
  TCompilerOptions,
} from '@rspack/test-tools';
import { getCompiler } from '@rspack/test-tools/case/common.js';
import type { IDiagnosticOptions } from '@rspack/test-tools/case/diagnostic.js';
import {
  createMultiCompilerRunner,
  getMultiCompilerRunnerKey,
} from '@rspack/test-tools/case/runner.js';
import fs from 'fs-extra';
import { createSnapshotSerializer } from 'path-serializer';
import { rimrafSync } from 'rimraf';
import { describe, expect, it } from 'vitest';
import { merge } from 'webpack-merge';

import { createRunner } from './suite.js';
import type { ITestSuite } from './suite.js';

function defaultOptions<T extends ECompilerType.Rspack>(
  context: ITestContext,
): TCompilerOptions<T> {
  return {
    target: 'node',
    context: context.getSource(),
    entry: {
      main: './',
    },
    mode: 'development',
    devServer: {
      hot: false,
    },
    infrastructureLogging: {
      debug: false,
    },
    output: {
      path: context.getDist(),
    },
    experiments: {
      css: true,
      rspackFuture: {
        bundlerInfo: {
          force: false,
        },
      },
      inlineConst: true,
      lazyBarrel: true,
    },
  } as TCompilerOptions<T>;
}

const serializer = createSnapshotSerializer({
  features: {
    addDoubleQuotes: false,
    escapeDoubleQuotes: false,
  },
  afterSerialize(val) {
    return val.replaceAll(/\d+:\d+/g, '<LINE:COLUMN>');
  },
});

function createCase(name: string, src: string, dist: string) {
  describe(name, () => {
    const runner = createRunner(
      src,
      dist,
      {
        key: getMultiCompilerRunnerKey,
        runner: createMultiCompilerRunner,
      },
    );

    for (const compilerType of [ECompilerType.Rspack, ECompilerType.Webpack]) {
      const caseName = `${name} - ${compilerType}`;
      const caseConfigFile = path.join(src, `${compilerType}.config.js`);

      describe.runIf(fs.existsSync(caseConfigFile))(caseName, async () => {
        it('should have error or warning', { timeout: 30000 }, async () => {
          runner(
            caseName,
            {
              config: async (context: ITestContext) => {
                const compiler = getCompiler(context, name);
                let options = defaultOptions(context);
                const custom = readConfigFile<ECompilerType.Rspack>(
                  ['rspack.config.js', 'webpack.config.js'].map(i =>
                    context.getSource(i)
                  ),
                )[0];
                if (custom) {
                  options = merge(options, custom);
                }
                if (!global.printLogger) {
                  options.infrastructureLogging = {
                    level: 'error',
                  };
                }
                compiler.setOptions(options);
              },
              compiler: async (context: ITestContext) => {
                const compiler = getCompiler(context, name);
                compiler.createCompiler();
              },
              build: async (context: ITestContext) => {
                const compiler = getCompiler(context, name);
                await compiler.build();
              },
              run: async () => {
                // no need to run, just check the snapshot of diagnostics
              },
              check: async (_: ITestEnv, context: ITestContext) => {
                await check(context, name, {
                  snapshot: './stats.err',
                  snapshotErrors: './raw-error.err',
                  snapshotWarning: './raw-warning.err',
                  format: (output: string) => {
                    // TODO: change to stats.errorStack
                    // TODO: add `errorStack: false`
                    return output.replace(/(│.* at ).*/g, '$1xxx');
                  },
                });
              },
            },
          );
        });
      });
    }
  });
}

async function check(
  context: ITestContext,
  name: string,
  options: IDiagnosticOptions,
) {
  const compiler = getCompiler(context, name);
  const stats = compiler.getStats();
  if (!stats) {
    throw new Error('Stats should exists');
  }
  expect(stats.hasErrors() || stats.hasWarnings());
  let output = serializer.serialize(
    stats.toString({
      all: false,
      errors: true,
      warnings: true,
    }),
  ).replaceAll('\\', '/');

  const statsJson = stats.toJson({
    all: false,
    errors: true,
    warnings: true,
  });
  const errors = (statsJson.errors ?? []).map(e => {
    // @ts-expect-error error message is already serialized in `stats.err`
    delete e.message;
    delete e.stack;
    return e;
  });
  const warnings = (statsJson.warnings ?? []).map(e => {
    // @ts-expect-error error message is already serialized in `stats.err`
    delete e.message;
    delete e.stack;
    return e;
  });

  if (typeof options.format === 'function') {
    output = options.format(output);
  }

  expect.addSnapshotSerializer(serializer);

  const errorOutputPath = path.resolve(context.getSource(options.snapshot));
  const errorStatsOutputPath = path.resolve(
    context.getSource(options.snapshotErrors),
  );
  const warningStatsOutputPath = path.resolve(
    context.getSource(options.snapshotWarning),
  );
  await expect(output).toMatchFileSnapshot(errorOutputPath);
  await expect(errors).toMatchFileSnapshot(errorStatsOutputPath);
  await expect(warnings).toMatchFileSnapshot(warningStatsOutputPath);
}

export function diagnosticCases(suite: ITestSuite): void {
  const distPath = path.resolve(suite.casePath, '../dist/diagnostic');
  rimrafSync(distPath);
  describeByWalk(suite.name, (name, src, dist) => {
    createCase(name, src, dist);
  }, {
    source: suite.casePath,
    dist: distPath,
    describe,
  });
}
