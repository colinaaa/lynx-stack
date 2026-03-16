import { afterEach, describe, expect, it, vi } from 'vitest';

describe('lynx/suspense branch guards', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('preact/compat');
    vi.doUnmock('preact/hooks');
    vi.doUnmock('@lynx-js/react/lepus');
  });

  it('fallback ref should handle missing remove-index without splicing', async () => {
    const createElementMock = vi.fn((type, props, ...children) => ({ type, props, children }));
    const mainCreateElementMock = vi.fn((type, props, ...children) => ({ type, props, children }));
    const childrenRef = { current: { __id: 4242 } };

    vi.doMock('preact/compat', () => ({
      Suspense: 'MockSuspense',
      createElement: createElementMock,
    }));
    vi.doMock('@lynx-js/react/lepus', () => ({
      createElement: mainCreateElementMock,
    }));
    vi.doMock('preact/hooks', () => ({
      useRef: () => childrenRef,
    }));

    // Use background createElement mock branch.
    // @ts-expect-error test flag
    globalThis.__MAIN_THREAD__ = false;

    const { Suspense } = await import('../../src/lynx/suspense');
    const { globalBackgroundSnapshotInstancesToRemove } = await import('../../src/lifecycle/patch/commit');

    globalBackgroundSnapshotInstancesToRemove.length = 0;

    Suspense({
      children: {} as never,
      fallback: {} as never,
    });

    const fallbackRef = createElementMock.mock.calls[1]?.[1]?.ref as (bsi: { __id: number }) => void;
    expect(typeof fallbackRef).toBe('function');

    fallbackRef({ __id: 1 });

    expect(globalBackgroundSnapshotInstancesToRemove).toEqual([]);
    expect(childrenRef.current).toBeUndefined();
  });
});
