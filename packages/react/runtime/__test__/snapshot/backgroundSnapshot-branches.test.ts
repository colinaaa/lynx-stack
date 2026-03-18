import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundSnapshotInstance, hydrate } from '../../src/backgroundSnapshot';
import { SnapshotInstance } from '../../src/snapshot';
import { SnapshotInstance } from '../../src/snapshot';
import { setPipeline, globalPipelineOptions } from '../../src/lynx/performance';
import { snapshotManager, SnapshotInstance } from '../../src/snapshot';
import { initGlobalSnapshotPatch, deinitGlobalSnapshotPatch } from '../../src/lifecycle/patch/snapshotPatch';
import { applyQueuedRefs } from '../../src/snapshot/ref';

describe('BackgroundSnapshotInstance branches', () => {
  // Use a unique tag to avoid conflict with other tests
  const TAG = 'view-perf-test';
  let originalProfile: boolean | undefined;

  beforeAll(() => {
    // Register a dummy snapshot definition
    snapshotManager.values.set(TAG, { slot: [] } as any);
  });

  afterAll(() => {
    snapshotManager.values.delete(TAG);
  });

  beforeEach(() => {
    // @ts-expect-error test runtime flag
    originalProfile = globalThis.__PROFILE__;
  });

  afterEach(() => {
    setPipeline(undefined);
    deinitGlobalSnapshotPatch();
    // @ts-expect-error restore runtime flag
    globalThis.__PROFILE__ = originalProfile;
    vi.restoreAllMocks();
  });

  it('sets needTimestamps when __ltf changes in setAttribute values', () => {
    initGlobalSnapshotPatch();
    const pipeline = {
      pipelineID: 'test-pipe-1',
      needTimestamps: false,
    } as any;
    setPipeline(pipeline);

    const inst = new BackgroundSnapshotInstance(TAG);

    // Case 1: Initial set with __ltf
    // value must be an object containing __ltf
    const val1 = { __ltf: 'a' };
    inst.setAttribute('values', [val1]);

    // (undefined)?.__ltf != 'a' -> true
    expect(pipeline.needTimestamps).toBe(true);

    // Reset flag to verify change detection
    pipeline.needTimestamps = false;

    // Case 2: Update with same __ltf -> no change
    const val2 = { __ltf: 'a' };
    inst.setAttribute('values', [val2]);
    expect(pipeline.needTimestamps).toBe(false);

    // Case 3: Update with different __ltf -> change
    const val3 = { __ltf: 'b' };
    inst.setAttribute('values', [val3]);
    expect(pipeline.needTimestamps).toBe(true);
  });

  it('sets needTimestamps when __spread contains __lynx_timing_flag change', () => {
    initGlobalSnapshotPatch();
    const pipeline = {
      pipelineID: 'test-pipe-2',
      needTimestamps: false,
    } as any;
    setPipeline(pipeline);

    const inst = new BackgroundSnapshotInstance(TAG);

    // Case 1: Initial spread with timing flag
    // The object must have __spread property to trigger the spread logic path,
    // AND the properties must be at the top level for transformSpread to pick them up.
    const spread1 = { __spread: {}, __lynx_timing_flag: 'x' };
    inst.setAttribute('values', [spread1]);

    expect(pipeline.needTimestamps).toBe(true);

    pipeline.needTimestamps = false;

    // Case 2: Update with same timing flag -> no change
    // Note: setAttributeImpl logic:
    // const oldSpread = ...?.__spread;
    // ...
    // newValueObj['__spread'] = newSpread;
    // ...
    // if (key == '__lynx_timing_flag' && oldSpread?.[key] != newSpreadValue ...)

    // We need to pass a new object, but logically same content.
    const spread2 = { __spread: {}, __lynx_timing_flag: 'x' };
    inst.setAttribute('values', [spread2]);
    expect(pipeline.needTimestamps).toBe(false);

    // Case 3: Update with different timing flag -> change
    const spread3 = { __spread: {}, __lynx_timing_flag: 'y' };
    inst.setAttribute('values', [spread3]);
    expect(pipeline.needTimestamps).toBe(true);
  });

  it('queues ref cleanup when removeChild is called', () => {
    initGlobalSnapshotPatch();

    // Setup snapshot definition with ref index pointing to index 0
    const REF_TAG = 'view-with-ref';
    snapshotManager.values.set(REF_TAG, {
      slot: [],
      refAndSpreadIndexes: [0],
    } as any);

    try {
      const parent = new BackgroundSnapshotInstance(TAG);
      const child = new BackgroundSnapshotInstance(REF_TAG);

      parent.appendChild(child);

      // Create a mock ref function
      const refFn = vi.fn();
      // Mark it as a ref (transformRef usually does this)
      Object.defineProperty(refFn, '__ref', { value: 1 });

      // Set the ref value on the child
      child.setAttribute('values', [refFn]);

      // Remove the child
      parent.removeChild(child);

      // Verify that the cleanup callback was queued and executed
      // applyQueuedRefs executes the queued ref callbacks
      applyQueuedRefs();

      // The cleanup should call the ref with null
      expect(refFn).toHaveBeenCalledWith(null);
    } finally {
      snapshotManager.values.delete(REF_TAG);
    }
  });

  it('handles removeChild ref traversal fallback branches', () => {
    initGlobalSnapshotPatch();

    const REF_TAG = 'view-with-mixed-ref-values';
    snapshotManager.values.set(REF_TAG, {
      slot: [],
      refAndSpreadIndexes: [0, 1],
    } as any);

    try {
      const parent = new BackgroundSnapshotInstance(TAG);
      const child = new BackgroundSnapshotInstance(REF_TAG);
      parent.appendChild(child);

      // index 0 => primitive, should hit the false branch of object/function guard
      // index 1 => object without __ref and with falsy spread ref, should hit else-if false branch
      child.setAttribute('values', [0, { __spread: {}, ref: null }]);

      parent.removeChild(child);
      applyQueuedRefs();

      expect(child.__parent).toBeNull();
    } finally {
      snapshotManager.values.delete(REF_TAG);
    }
  });

  it('setAttribute values should skip profileEnd branch when __PROFILE__ is false', () => {
    initGlobalSnapshotPatch();
    // @ts-expect-error test runtime flag
    globalThis.__PROFILE__ = false;

    const inst = new BackgroundSnapshotInstance(TAG);
    expect(() => inst.setAttribute('values', [{ __ltf: 'x' }])).not.toThrow();
  });

  it('hydrates spread gesture values via __isGesture path', () => {
    const gesture = {
      __isGesture: true,
      type: 0,
      callbacks: {
        onUpdate: { _wkltId: 'gesture:1' },
      },
    } as any;

    const after = new BackgroundSnapshotInstance(TAG);
    after.setAttribute('values', [{
      __spread: {},
      'main-thread:gesture': gesture,
      style: { width: 100 },
    }]);

    const before = {
      id: after.__id,
      type: TAG,
      values: [{}],
      children: [],
    } as any;

    expect(() => hydrate(before, after)).not.toThrow();
  });

  it('throws when creating unknown snapshot type', () => {
    expect(() => {
      new BackgroundSnapshotInstance('unknown-type');
    }).toThrow('BackgroundSnapshot not found: unknown-type');
  });

  it('throws when removing non-child node', () => {
    const parent = new BackgroundSnapshotInstance(TAG);
    const orphan = new BackgroundSnapshotInstance(TAG);
    expect(() => {
      parent.removeChild(orphan);
    }).toThrow('The node to be removed is not a child of this node.');
  });

  it('covers remaining switch branches in ensureElements', () => {
    const TAG_ATTR = 'test-attr';
    snapshotManager.values.set(TAG_ATTR, { slot: [[0, 0]], create: Array as any } as any);
    const instAttr = new SnapshotInstance(TAG_ATTR);
    instAttr.__firstChild = new SnapshotInstance(TAG_ATTR);
    instAttr.ensureElements();
    snapshotManager.values.delete(TAG_ATTR);

    const TAG_SPREAD = 'test-spread';
    snapshotManager.values.set(TAG_SPREAD, { slot: [[1, 0]], create: Array as any } as any);
    const instSpread = new SnapshotInstance(TAG_SPREAD);
    instSpread.__firstChild = new SnapshotInstance(TAG_SPREAD);
    instSpread.ensureElements();
    snapshotManager.values.delete(TAG_SPREAD);

    const TAG_DEFAULT = 'test-default';
    snapshotManager.values.set(TAG_DEFAULT, { slot: [[-1, 0]], create: Array as any } as any);
    const instDefault = new SnapshotInstance(TAG_DEFAULT);
    instDefault.__firstChild = new SnapshotInstance(TAG_DEFAULT);
    instDefault.ensureElements();
    snapshotManager.values.delete(TAG_DEFAULT);
  });
});
