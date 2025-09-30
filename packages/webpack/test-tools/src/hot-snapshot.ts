// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import path from 'node:path';

import { ECompilerType, describeByWalk } from '@rspack/test-tools';
import { createHotStepProcessor } from '@rspack/test-tools/case/hot-step.js';
import { createHotRunner } from '@rspack/test-tools/case/hot.js';
import fs from 'fs-extra';
import { rimrafSync } from 'rimraf';
import { describe, test } from 'vitest';

import { createRunner } from './suite.js';
import type { ITestSuite } from './suite.js';

function createCase(name: string, src: string, dist: string) {
  describe(name, () => {
    for (const compilerType of [ECompilerType.Rspack]) {
      const caseName = `${name} - ${compilerType}`;
      const caseConfigFile = path.join(src, `${compilerType}.config.js`);
      const compilerDist = path.join(dist, compilerType);
      const runner = createRunner(src, compilerDist, {
        key: (_, name) => name,
        runner: createHotRunner,
      });

      describe(caseName, async () => {
        if (!fs.existsSync(caseConfigFile)) {
          test.skip(caseName);
          return;
        }
        runner(
          caseName,
          createHotStepProcessor(caseName, 'web'),
        );
      });
    }
  });
}

export function hotSnapshotCases(suite: ITestSuite): void {
  const distPath = path.resolve(suite.casePath, '../js/hot-snapshot');
  rimrafSync(distPath);
  describeByWalk(suite.name, (name, src, dist) => {
    createCase(name, src, dist);
  }, {
    source: suite.casePath,
    dist: distPath,
    describe,
  });
}
