import { afterEach, describe, expect, it } from 'vitest';

import { commitPatchUpdate } from '../../../src/lifecycle/patch/commit';

describe('lifecycle/patch/commit branch guards', () => {
  const originalProfileFlag = __PROFILE__;

  afterEach(() => {
    // @ts-expect-error restore test flag
    globalThis.__PROFILE__ = originalProfileFlag;
  });

  it('commitPatchUpdate should skip profile hooks when __PROFILE__ is false', () => {
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;

    lynx.performance.profileStart.mockClear();
    lynx.performance.profileEnd.mockClear();

    const res = commitPatchUpdate(
      {
        patchList: [{ id: 1 }],
      },
      {},
    );

    expect(typeof res.data).toBe('string');
    expect(res.patchOptions.reloadVersion).toBeTypeOf('number');
    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::commitChanges');
    expect(lynx.performance.profileEnd).not.toHaveBeenCalled();
  });
});
