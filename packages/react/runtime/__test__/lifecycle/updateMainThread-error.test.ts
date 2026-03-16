import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { injectUpdateMainThread } from '../../src/lifecycle/patch/updateMainThread';
import { LifecycleConstant } from '../../src/lifecycleConstant';
import { clearConfigCacheForTesting } from '../../src/worklet/functionality';

describe('updateMainThread delayed worklet error path', () => {
  const originalImpl = globalThis.lynxWorkletImpl?._runRunOnMainThreadTask;

  beforeEach(() => {
    injectUpdateMainThread();
    clearConfigCacheForTesting();
    SystemInfo.lynxSdkVersion = '3.1';
    globalThis.lynxWorkletImpl ??= {
      _runRunOnMainThreadTask: vi.fn(),
      _eomImpl: {
        setShouldFlush: vi.fn(),
      },
    } as never;
    globalThis.lynxWorkletImpl._eomImpl ??= {
      setShouldFlush: vi.fn(),
    };
  });

  afterEach(() => {
    if (globalThis.lynxWorkletImpl?._runRunOnMainThreadTask) {
      globalThis.lynxWorkletImpl._runRunOnMainThreadTask = originalImpl;
    }
  });

  it('should report errors thrown by delayed runOnMainThread tasks', () => {
    const err = new Error('runOnMainThread failed');
    const reportError = vi.fn();
    globalThis.lynx.reportError = reportError;
    globalThis.lynxWorkletImpl._runRunOnMainThreadTask = vi.fn(() => {
      throw err;
    });

    const updateMainThread = globalThis[LifecycleConstant.patchUpdate] as (payload: {
      data: string;
      patchOptions: {
        reloadVersion: number;
        isHydration?: boolean;
      };
    }) => void;

    updateMainThread({
      data: JSON.stringify({
        patchList: [],
        delayedRunOnMainThreadData: [
          {
            worklet: ['foo', null],
            params: [],
            resolveId: 1,
          },
        ],
      }),
      patchOptions: {
        reloadVersion: 0,
      },
    });

    expect(reportError).toHaveBeenCalledWith(err);
  });

  it('should skip BTS->MTS ALog output when __ALOG__ is false', () => {
    const originalAlogFlag = __ALOG__;
    globalThis.__ALOG__ = false;
    console.alog = vi.fn();

    const updateMainThread = globalThis[LifecycleConstant.patchUpdate] as (payload: {
      data: string;
      patchOptions: {
        reloadVersion: number;
      };
    }) => void;

    try {
      updateMainThread({
        data: JSON.stringify({ patchList: [] }),
        patchOptions: {
          reloadVersion: 0,
        },
      });

      expect(console.alog).not.toHaveBeenCalled();
    } finally {
      globalThis.__ALOG__ = originalAlogFlag;
    }
  });
});
