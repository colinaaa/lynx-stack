import { afterEach, describe, expect, it, vi } from 'vitest';

describe('lifecycle/destroy branch guards', () => {
  const originalProfileFlag = __PROFILE__;

  afterEach(() => {
    // @ts-expect-error restore test flag
    globalThis.__PROFILE__ = originalProfileFlag;
    vi.resetModules();
  });

  it('destroyBackground should skip delayedEvents cleanup when delayedEvents is undefined', async () => {
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;

    const delayEventsModule = await import('../../src/lifecycle/event/delayEvents');
    expect(delayEventsModule.delayedEvents).toBeUndefined();

    const { destroyBackground } = await import('../../src/lifecycle/destroy');
    expect(() => destroyBackground()).not.toThrow();

    const delayEventsModuleAfter = await import('../../src/lifecycle/event/delayEvents');
    expect(delayEventsModuleAfter.delayedEvents).toBeUndefined();
  });
});
