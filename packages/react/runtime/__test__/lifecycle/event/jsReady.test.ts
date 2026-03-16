import { afterEach, describe, expect, it } from 'vitest';

import { jsReady, resetJSReady } from '../../../src/lifecycle/event/jsReady';

describe('lifecycle/event/jsReady', () => {
  const originalProfileFlag = __PROFILE__;

  afterEach(() => {
    // @ts-expect-error test flag restore
    globalThis.__PROFILE__ = originalProfileFlag;
  });

  it('should dispatch firstScreen without profiling when __PROFILE__ is disabled', () => {
    // @ts-expect-error test flag branch
    globalThis.__PROFILE__ = false;
    resetJSReady();

    jsReady();

    expect(__OnLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(lynx.performance.profileStart).not.toHaveBeenCalled();
    expect(lynx.performance.profileEnd).not.toHaveBeenCalled();
  });
});
