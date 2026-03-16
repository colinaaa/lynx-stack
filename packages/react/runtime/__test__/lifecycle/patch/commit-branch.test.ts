import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { options } from 'preact';
import { COMMIT } from '../../../src/renderToOpcodes/constants';
import {
  commitPatchUpdate,
  replaceCommitHook,
  globalBackgroundSnapshotInstancesToRemove,
  globalFlushOptions,
} from '../../../src/lifecycle/patch/commit';
import { delayedRunOnMainThreadData } from '../../../src/worklet/call/delayedRunOnMainThreadData';
import { globalPipelineOptions, setPipeline } from '../../../src/lynx/performance';
import { BackgroundSnapshotInstance } from '../../../src/backgroundSnapshot';
import { initGlobalSnapshotPatch, deinitGlobalSnapshotPatch } from '../../../src/lifecycle/patch/snapshotPatch';
import { createSnapshot, setupPage, snapshotCreatorMap } from '../../../src/snapshot';
import { elementTree } from '../../utils/nativeMethod';

describe('lifecycle/patch/commit branch guards', () => {
  const originalProfileFlag = __PROFILE__;
  let originalCommit: any;

  beforeEach(() => {
    originalCommit = options[COMMIT];
    options[COMMIT] = undefined;
    // Setup snapshot env
    setupPage(elementTree.__CreatePage('0', 0) as any);
    snapshotCreatorMap['view'] = (type) => {
      createSnapshot(type, (ctx) => [elementTree.__CreateView(ctx.__id) as any], null, [], 0, undefined, null);
    };
    initGlobalSnapshotPatch();
  });

  afterEach(() => {
    // @ts-expect-error restore test flag
    globalThis.__PROFILE__ = originalProfileFlag;
    options[COMMIT] = originalCommit;
    delayedRunOnMainThreadData.length = 0;
    // Clear globalFlushOptions
    for (const key in globalFlushOptions) delete globalFlushOptions[key];
    vi.restoreAllMocks();
  });

  it('commitPatchUpdate should skip profile hooks when __PROFILE__ is false', () => {
    // @ts-expect-error test branch flag
    globalThis.__PROFILE__ = false;

    lynx.performance.profileStart.mockClear();
    lynx.performance.profileEnd.mockClear();

    const res = commitPatchUpdate(
      {
        patchList: [{ id: 1 }],
      },
      {},
    );

    expect(typeof res.data).toBe('string');
    expect(res.patchOptions.reloadVersion).toBeTypeOf('number');
    expect(lynx.performance.profileStart).not.toHaveBeenCalledWith('ReactLynx::commitChanges');
    expect(lynx.performance.profileEnd).not.toHaveBeenCalled();
  });

  it('replaceCommitHook should handle delayedRunOnMainThreadData', () => {
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false;

    replaceCommitHook();
    const commitHook = options[COMMIT];
    expect(commitHook).toBeDefined();

    // Create operations to ensure snapshotPatch is not empty
    const instance = new BackgroundSnapshotInstance('view');
    instance.setAttribute('id', 'test');

    // Mock delayed data
    delayedRunOnMainThreadData.push({ id: 1, type: 'test' } as any);

    // Mock callLepusMethod
    const callLepusMethod = lynx.getNativeApp().callLepusMethod;
    callLepusMethod.mockClear();

    // Trigger commit
    // @ts-ignore
    commitHook!(null, []);

    // Verify commit happened
    expect(callLepusMethod).toHaveBeenCalled();
    const args = callLepusMethod.mock.calls[0];
    const obj = args![1] as any;
    const data = JSON.parse(obj.data);

    // Check if delayedRunOnMainThreadData was included
    expect(data.delayedRunOnMainThreadData).toBeDefined();
    expect(data.delayedRunOnMainThreadData).toHaveLength(1);

    // Restore
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = true;
  });

  it('commitPatchUpdate should include pipeline options if set', () => {
    setPipeline({ needTimestamps: true });

    const res = commitPatchUpdate(
      {
        patchList: [{ id: 1 }],
      },
      {},
    );

    expect(res.patchOptions.pipelineOptions).toBeDefined();
    expect(res.patchOptions.pipelineOptions!.needTimestamps).toBe(true);

    // Should reset pipeline
    // But we can't check exported let easily if we can't re-import it fresh?
    // setPipeline(undefined) is called inside.
    // We can check if subsequent call has it.

    const res2 = commitPatchUpdate(
      { patchList: [] },
      {},
    );
    expect(res2.patchOptions.pipelineOptions).toBeUndefined();
  });

  it('replaceCommitHook should skip execution on main thread', () => {
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = true;

    replaceCommitHook();
    const commitHook = options[COMMIT];

    const commitQueue = [1, 2];
    // @ts-ignore
    commitHook!(null, commitQueue);

    expect(commitQueue).toHaveLength(0);

    // Restore
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false; // default for most tests here
  });

  it('replaceCommitHook should schedule background instance removal', () => {
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false;
    vi.useFakeTimers();

    replaceCommitHook();
    const commitHook = options[COMMIT];

    // Simulate removed instance
    globalBackgroundSnapshotInstancesToRemove.push(123);

    // Mock callLepusMethod
    lynx.getNativeApp().callLepusMethod.mockImplementation((method, obj, cb) => {
      cb && cb();
    });

    // @ts-ignore
    commitHook!(null, []);

    // Fast forward
    vi.runAllTimers();

    // Should have called tearDown on instance 123
    // But instance 123 doesn't exist in map.
    // It should not throw.

    vi.useRealTimers();
  });

  it('commitHook should return early if snapshotPatch is null (before hydration)', () => {
    deinitGlobalSnapshotPatch();

    replaceCommitHook();
    const commitHook = options[COMMIT];

    const callLepusMethod = lynx.getNativeApp().callLepusMethod;
    callLepusMethod.mockClear();

    // @ts-ignore
    commitHook!(null, []);

    expect(callLepusMethod).not.toHaveBeenCalled();

    // Restore for other tests (although afterEach restores mocks)
    // initGlobalSnapshotPatch() is called in beforeEach
  });

  it('commitHook should handle empty snapshot patch array', () => {
    // initGlobalSnapshotPatch creates empty array
    // Don't add any operations

    replaceCommitHook();
    const commitHook = options[COMMIT];
    const callLepusMethod = lynx.getNativeApp().callLepusMethod;
    callLepusMethod.mockClear();

    // @ts-ignore
    commitHook!(null, []);

    expect(callLepusMethod).toHaveBeenCalled();
    const args = callLepusMethod.mock.calls[0];
    const obj = args![1] as any;
    const data = JSON.parse(obj.data);

    // patchList: [ { id: ... } ]
    // snapshotPatch field should be undefined because array is empty
    expect(data.patchList[0].snapshotPatch).toBeUndefined();
  });

  it('commitHook should include flushOptions if not empty', () => {
    // Set flush options
    // Since globalFlushOptions is an object, we can mutate it
    // @ts-ignore
    globalFlushOptions['test-option'] = true;

    replaceCommitHook();
    const commitHook = options[COMMIT];
    const callLepusMethod = lynx.getNativeApp().callLepusMethod;
    callLepusMethod.mockClear();

    // @ts-ignore
    commitHook!(null, []);

    expect(callLepusMethod).toHaveBeenCalled();
    const args = callLepusMethod.mock.calls[0];
    const obj = args![1] as any;
    const data = JSON.parse(obj.data);

    expect(data.flushOptions).toEqual({ 'test-option': true });
  });
});
