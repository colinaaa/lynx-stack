// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/unbound-method */

import { createPlugin } from '../../helpers.js';

export const position: void = createPlugin(({ addUtilities, variants }) => {
  addUtilities(
    {
      '.fixed': { position: 'fixed' },
      '.absolute': { position: 'absolute' },
      '.relative': { position: 'relative' },
      '.sticky': {
        position: 'sticky',
      },
      // Below are not supported by Lynx:
      // '.static': { position: 'static' },
    },
    variants('position'),
  );
});
