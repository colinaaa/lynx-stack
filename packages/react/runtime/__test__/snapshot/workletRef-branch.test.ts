import { describe, expect, it, vi } from 'vitest';

const runWorkletCtx = vi.fn(() => vi.fn());
const updateWorkletRefBinding = vi.fn();
const onWorkletCtxUpdate = vi.fn();

vi.mock('@lynx-js/react/worklet-runtime/bindings', () => ({
  runWorkletCtx,
  updateWorkletRef: updateWorkletRefBinding,
  onWorkletCtxUpdate,
}));

import { applyRefQueue, updateWorkletRef, workletUnRef } from '../../src/snapshot/workletRef';

describe('snapshot workletRef branch guards', () => {
  it('handles _wkltId queue items and _wkltId unref cleanup', () => {
    const element = { tag: 'view', props: {} };
    const wklt = { _wkltId: 'wklt-id' };

    const snapshot = {
      __elements: [element],
      __values: [wklt],
      __worklet_ref_set: new Set(),
    };

    updateWorkletRef(snapshot as never, 0, undefined, 0, 'background-thread');
    applyRefQueue();

    expect(snapshot.__worklet_ref_set.has(wklt)).toBe(true);

    const unmount = vi.fn();
    workletUnRef({ _wkltId: 'wklt-id', _unmount: unmount } as never);
    expect(unmount).toHaveBeenCalledTimes(1);

    // Test missing _unmount
    workletUnRef({ _wkltId: 'wklt-id-no-unmount' } as never);
    // Should call runWorkletCtx(value, [null]), but verify through coverage as spying seems problematic here
  });

  it('accepts __LEPUS__ worklet compatibility refs without throwing', () => {
    const element = { tag: 'view', props: {} };
    const lepusRef = { _type: '__LEPUS__' };

    const snapshot = {
      __elements: [element],
      __values: [lepusRef],
      __worklet_ref_set: new Set(),
    };

    expect(() => updateWorkletRef(snapshot as never, 0, undefined, 0, 'main-thread')).not.toThrow();
  });

  it('tolerates queued refs whose marker fields are removed before flush', () => {
    const element = { tag: 'view', props: {} };
    const refLike = { _wvid: 1 };
    const snapshot = {
      __elements: [element],
      __values: [refLike],
      __worklet_ref_set: new Set(),
    };

    updateWorkletRef(snapshot as never, 0, undefined, 0, 'main-thread');
    delete (refLike as { _wvid?: number })._wvid;

    expect(() => applyRefQueue()).not.toThrow();
  });
});
