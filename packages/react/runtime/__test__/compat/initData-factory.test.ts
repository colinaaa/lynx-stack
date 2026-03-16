import { describe, expect, it, vi } from 'vitest';

import { factory } from '../../src/compat/initData';
import { globalFlushOptions } from '../../src/lifecycle/patch/commit';

describe('initData factory with __globalProps', () => {
  it('should not set triggerDataUpdated for __globalProps listeners', () => {
    const listenerCbs: Array<() => void> = [];
    const set = vi.fn();

    const createContext = () => ({
      Provider: Symbol('Provider'),
      Consumer: Symbol('Consumer'),
    });

    const useState = vi.fn((value: unknown) => [value, set]);

    const createElement = vi.fn();

    const useLynxGlobalEventListener = vi.fn((_: string, cb: () => void) => {
      listenerCbs.push(cb);
    });

    globalThis.__LEPUS__ = false;
    globalThis.lynx.__globalProps = { a: 1 } as never;
    globalFlushOptions.triggerDataUpdated = false;

    const getters = factory(
      {
        createContext: createContext as never,
        useState: useState as never,
        createElement: createElement as never,
        useLynxGlobalEventListener: useLynxGlobalEventListener as never,
      },
      '__globalProps',
      'onGlobalPropsChanged',
    );

    const useGlobalProps = getters.use();
    const Provider = getters.Provider();

    useGlobalProps();
    Provider({ children: null });

    globalThis.lynx.__globalProps = { a: 2 } as never;
    listenerCbs.forEach(cb => cb());

    expect(set).toHaveBeenCalledWith({ a: 2 });
    expect(globalFlushOptions.triggerDataUpdated).toBe(false);
  });
});
