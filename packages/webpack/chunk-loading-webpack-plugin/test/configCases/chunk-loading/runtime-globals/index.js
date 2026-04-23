// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/// <reference types="@rspack/test-tools/rstest" />

import { createRequire } from 'node:module';
import path from 'node:path';

/* global __filename, __dirname, rstest */

const require = createRequire(__filename);
const lynx = (globalThis.lynx = {
  loadLazyBundle: rstest.fn(function loadLazyBundle(request) {
    return Promise.resolve().then(() => {
      return require(path.join(__dirname, `${request}.rspack.bundle.cjs`));
    });
  }),
});

it('should work with chunk loading require', async function() {
  await import(
    /* webpackChunkName: 'dynamic' */
    './dynamic.js'
  );
  expect(__webpack_require__.lynx_aci).toHaveProperty('dynamic');
  expect(lynx.loadLazyBundle).toBeCalled();
});
