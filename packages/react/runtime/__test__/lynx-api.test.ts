import { afterEach, describe, expect, it, vi } from 'vitest';

import { root } from '../src/lynx-api';
import { __root } from '../src/root';

describe('lynx-api root', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should assign jsx directly when running on main thread', () => {
    const jsx = { type: 'view', props: {} } as const;
    const prev = __root.__jsx;

    vi.stubGlobal('__MAIN_THREAD__', true);
    root.render(jsx as never);

    expect(__root.__jsx).toBe(jsx);

    __root.__jsx = prev;
  });

  it('should skip background profile hooks when __PROFILE__ is false', () => {
    vi.stubGlobal('__MAIN_THREAD__', false);
    vi.stubGlobal('__PROFILE__', false);

    lynx.performance.profileStart.mockClear();
    lynx.performance.profileEnd.mockClear();

    root.render(null as never);

    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::renderBackground');
  });

  it('should delegate registerDataProcessors to lynx runtime', () => {
    const fn = vi.fn();
    globalThis.lynx.registerDataProcessors = fn;

    const definition = {
      globalDataProcessor: vi.fn(),
    };

    root.registerDataProcessors(definition as never);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(definition);
  });
});
