import { afterEach, describe, expect, it, vi } from 'vitest';

describe('useLynxGlobalEventListener guard branch', () => {
  const originalLynx = globalThis.lynx;

  afterEach(() => {
    globalThis.lynx = originalLynx;
    vi.resetModules();
    vi.doUnmock('preact/hooks');
  });

  it('cleanup should no-op when previous listener args do not exist', async () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();

    globalThis.lynx = {
      ...originalLynx,
      getJSModule: () => ({ addListener, removeListener }),
    } as never;

    vi.doMock('preact/hooks', () => ({
      useRef: () => ({ current: undefined }),
      useMemo: () => {},
      useEffect: (effect: () => (() => void) | void) => {
        effect()?.();
      },
    }));

    const { useLynxGlobalEventListener } = await import('../../src/hooks/useLynxGlobalEventListener');

    expect(() => useLynxGlobalEventListener('evt', () => {})).not.toThrow();
    expect(addListener).not.toHaveBeenCalled();
    expect(removeListener).not.toHaveBeenCalled();
  });
});
