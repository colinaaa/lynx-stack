// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { createRequire } from 'node:module';

import type { LoaderContext } from '@rspack/core';

import { getBackgroundTransformOptions } from './options.js';
import type { ReactLoaderOptions } from './options.js';

function backgroundLoader(
  this: LoaderContext<ReactLoaderOptions>,
  content: string,
): void {
  const require = createRequire(import.meta.url);
  const { transformPath = '@lynx-js/react/transform' } = this.getOptions();
  const { transformReactLynxSync } = require(
    transformPath,
  ) as typeof import('@lynx-js/react/transform');
  const result = transformReactLynxSync(
    content,
    getBackgroundTransformOptions.call(this),
  );

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      if (this.experiments?.emitDiagnostic) {
        // Rspack with `emitDiagnostic` API
        try {
          this.experiments.emitDiagnostic({
            message: error.text!,
            sourceCode: content,
            location: {
              line: error.location?.line ?? 1,
              column: error.location?.column ?? 0,
              length: error.location?.length ?? 0,
              text: error.text ?? '',
            },
            severity: 'error',
          });
        } catch {
          // Rspack may throw on invalid line & column when containing UTF-8.
          // We catch it up here.
          this.emitError(new Error(error.text));
        }
      } else {
        // Webpack or legacy Rspack
        this.emitError(new Error(error.text));
      }
    }
    this.callback(new Error('react-transform failed'));

    return;
  }

  for (const warning of result.warnings) {
    if (this.experiments?.emitDiagnostic) {
      // Rspack with `emitDiagnostic` API
      try {
        this.experiments.emitDiagnostic({
          message: warning.text!,
          sourceCode: content,
          location: {
            line: warning.location?.line ?? 1,
            column: warning.location?.column ?? 0,
            length: warning.location?.length ?? 0,
            text: warning.text ?? '',
          },
          severity: 'warning',
        });
      } catch {
        // Rspack may throw on invalid line & column when containing UTF-8.
        // We catch it up here.
        this.emitWarning(new Error(warning.text));
      }
    } else {
      // Webpack or legacy Rspack
      this.emitWarning(new Error(warning.text));
    }
  }
  this.callback(null, result.code, result.map);
}

export default backgroundLoader;
