// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { createPlugin } from '../../helpers.js';
import type { Plugin } from '../../helpers.js';

export const visibility: Plugin = createPlugin(({ addUtilities }) => {
  addUtilities({
    '.visible': { visibility: 'visible' },
    '.invisible': { visibility: 'hidden' },
    // Lynx does not support 'collapse'
    // '.collapse': { visibility: 'collapse' },
  });
});
