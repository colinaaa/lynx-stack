import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { renderMainThread } from '../../src/lifecycle/render';
import { __root } from '../../src/root';
import { setupPage } from '../../src/snapshot';
import { globalEnvManager } from '../utils/envManager';
import { elementTree } from '../utils/nativeMethod';

describe('lifecycle/render branch guards', () => {
  const originalProfileFlag = __PROFILE__;
  const originalEnableSSR = __ENABLE_SSR__;

  beforeAll(() => {
    setupPage(__CreatePage('0', 0));
  });

  beforeEach(() => {
    globalEnvManager.resetEnv();
    globalEnvManager.switchToMainThread();
  });

  afterEach(() => {
    // @ts-expect-error restore globals used in branch tests
    globalThis.__PROFILE__ = originalProfileFlag;
    // @ts-expect-error restore globals used in branch tests
    globalThis.__ENABLE_SSR__ = originalEnableSSR;
    elementTree.clear();
  });

  it('should skip render profiling hooks when __PROFILE__ is disabled', () => {
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;
    __root.__jsx = null as never;

    lynx.performance.profileStart.mockClear();
    lynx.performance.profileEnd.mockClear();

    renderMainThread();

    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::renderMainThread');
    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::renderOpcodes');
  });

  it('should not persist opcodes onto root when __ENABLE_SSR__ is false', () => {
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;
    // @ts-expect-error test branch flag
    globalThis.__ENABLE_SSR__ = false;

    __root.__jsx = null as never;
    __root.__opcodes = ['sentinel'] as never;

    renderMainThread();

    expect(__root.__opcodes).toEqual(['sentinel']);
  });
});
