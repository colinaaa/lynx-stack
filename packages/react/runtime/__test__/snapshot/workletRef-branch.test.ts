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
});
