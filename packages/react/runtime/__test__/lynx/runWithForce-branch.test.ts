import { describe, expect, it } from 'vitest';

import { __root } from '../../src/root';
import { runWithForce } from '../../src/lynx/runWithForce';

describe('runWithForce guard branch', () => {
  it('should not replace __root.__jsx when vnode has no ORIGINAL marker', () => {
    const originalJsx = __root.__jsx;
    const vnodeWithoutOriginal = {} as typeof __root.__jsx;

    __root.__jsx = vnodeWithoutOriginal;
    runWithForce(() => {});

    expect(__root.__jsx).toBe(vnodeWithoutOriginal);

    __root.__jsx = originalJsx;
  });
});
