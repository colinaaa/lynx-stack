// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/// <reference types="@rspack/test-tools/rstest" />

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/* global __filename, __dirname, rstest */

const require = createRequire(__filename);
globalThis.lynx = {
  requireModuleAsync: rstest.fn(function requireModuleAsync(request, callback) {
    return Promise.resolve().then(() => {
      try {
        callback(null, require(path.join(__dirname, request)));
      } catch (error) {
        callback(error);
      }
    });
  }),
};

it('should have dynamic chunks', () => {
  const assets = fs.readdirSync(__dirname);

  expect(
    assets.some(asset => asset.endsWith('_dynamic_css.rspack.bundle.css')),
  ).toBeTruthy();
});

it('should work with chunk loading require', async function() {
  await import('./dynamic.css').then(module => {
    expect(module).not.toBeUndefined();
  });
});
