// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ECompilerType, TTestConfig } from '@rspack/test-tools';

export * from './hot.js';
export * from './hot-snapshot.js';
export * from './diagnostic.js';
export * from './case.js';
export * from './suite.js';
export * from './helper/checkSourceMap.js';

/** @deprecated - Use {@link TTestConfig} instead */
export type TConfigCaseConfig<T extends ECompilerType> = TTestConfig<T>;
export type { TTestConfig };
