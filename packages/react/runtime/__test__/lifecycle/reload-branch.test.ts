import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { reloadBackground, reloadMainThread } from '../../src/lifecycle/reload';
import { __root } from '../../src/root';
import { setupPage } from '../../src/snapshot';
import { globalEnvManager } from '../utils/envManager';

describe('lifecycle/reload branch guards', () => {
  const originalProfileFlag = __PROFILE__;

  beforeAll(() => {
    setupPage(__CreatePage('0', 0));
  });

  beforeEach(() => {
    globalEnvManager.resetEnv();
    lynx.performance.profileStart.mockClear();
    lynx.performance.profileEnd.mockClear();
  });

  afterEach(() => {
    // @ts-expect-error restore test flag
    globalThis.__PROFILE__ = originalProfileFlag;
  });

  it('reloadMainThread should skip reload profiling hooks when __PROFILE__ is false', () => {
    globalEnvManager.switchToMainThread();
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;
    __root.__jsx = null as never;

    reloadMainThread({}, {} as never);

    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::reloadMainThread');
  });

  it('reloadBackground should skip reload profiling hooks when __PROFILE__ is false', () => {
    globalEnvManager.switchToBackground();
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;
    __root.__jsx = null as never;

    reloadBackground({});

    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::reloadBackground');
  });
});
