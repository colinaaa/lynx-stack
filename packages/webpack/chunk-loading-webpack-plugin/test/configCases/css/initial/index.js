// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './foo.css';

it('should install the CSS chunk', async function() {
  const hasChunkInstalled = Object.keys(__webpack_require__.O).every(key =>
    __webpack_require__.O[key]('css-test_configCases_css_initial_foo_css')
  );

  expect(hasChunkInstalled).toBe(true);
});
