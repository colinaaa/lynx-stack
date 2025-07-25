// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Implements the commit phase of the rendering lifecycle.
 * This module patches Preact's commit phase to integrate with the snapshot system,
 * handling the collection and transmission of patches between threads.
 *
 * The commit phase is responsible for:
 * - Collecting patches from the snapshot system
 * - Managing commit tasks and their execution
 * - Coordinating with the native layer for updates
 * - Handling performance timing and pipeline options
 */

/**
 * This module patches Preact's commit phase by hacking into the internal of
 * its [options](https://preactjs.com/guide/v10/options/) API
 */

import type { VNode } from 'preact';
import { options } from 'preact';

import { LifecycleConstant } from '../../lifecycleConstant.js';
import { globalPipelineOptions, markTiming, markTimingLegacy, setPipeline } from '../../lynx/performance.js';
import { COMMIT } from '../../renderToOpcodes/constants.js';
import { applyQueuedRefs } from '../../snapshot/ref.js';
import { backgroundSnapshotInstanceManager } from '../../snapshot.js';
import { isEmptyObject } from '../../utils.js';
import { takeWorkletRefInitValuePatch } from '../../worklet/workletRefPool.js';
import { getReloadVersion } from '../pass.js';
import type { SnapshotPatch } from './snapshotPatch.js';
import { takeGlobalSnapshotPatch } from './snapshotPatch.js';

let globalFlushOptions: FlushOptions = {};

const globalCommitTaskMap: Map<number, () => void> = /*@__PURE__*/ new Map<number, () => void>();
let nextCommitTaskId = 1;

let globalBackgroundSnapshotInstancesToRemove: number[] = [];

/**
 * A single patch operation.
 */
interface Patch {
  // TODO: ref: do we need `id`?
  id: number;
  snapshotPatch?: SnapshotPatch;
  workletRefInitValuePatch?: [id: number, value: unknown][];
}

/**
 * List of patches to be applied in a single update cycle with flush options.
 */
interface PatchList {
  patchList: Patch[];
  flushOptions?: FlushOptions;
}

/**
 * Configuration options for patch operations
 */
interface PatchOptions {
  pipelineOptions?: PipelineOptions;
  reloadVersion: number;
  isHydration?: boolean;
}

/**
 * Replaces Preact's default commit hook with our custom implementation
 */
function replaceCommitHook(): void {
  // This is actually not used since Preact use `hooks._commit` for callbacks of `useLayoutEffect`.
  const originalPreactCommit = options[COMMIT];
  const commit = async (vnode: VNode, commitQueue: any[]) => {
    // Skip commit phase for MT runtime
    if (__MAIN_THREAD__) {
      // for testing only
      commitQueue.length = 0;
      return;
    }

    // Mark the end of virtual DOM diffing phase for performance tracking
    markTimingLegacy('updateDiffVdomEnd');
    markTiming('diffVdomEnd');

    const backgroundSnapshotInstancesToRemove = globalBackgroundSnapshotInstancesToRemove;
    globalBackgroundSnapshotInstancesToRemove = [];

    const commitTaskId = genCommitTaskId();

    // Register the commit task
    globalCommitTaskMap.set(commitTaskId, () => {
      if (backgroundSnapshotInstancesToRemove.length) {
        setTimeout(() => {
          backgroundSnapshotInstancesToRemove.forEach(id => {
            backgroundSnapshotInstanceManager.values.get(id)?.tearDown();
          });
        }, 10000);
      }
    });

    // Collect patches for this update
    const snapshotPatch = takeGlobalSnapshotPatch();
    const flushOptions = globalFlushOptions;
    const workletRefInitValuePatch = takeWorkletRefInitValuePatch();
    globalFlushOptions = {};
    if (!snapshotPatch && workletRefInitValuePatch.length === 0) {
      // before hydration, skip patch
      applyQueuedRefs();
      originalPreactCommit?.(vnode, commitQueue);
      return;
    }

    const patch: Patch = {
      id: commitTaskId,
    };
    // TODO: check all fields in `flushOptions` from runtime3
    if (snapshotPatch?.length) {
      patch.snapshotPatch = snapshotPatch;
    }
    if (workletRefInitValuePatch.length) {
      patch.workletRefInitValuePatch = workletRefInitValuePatch;
    }
    const patchList: PatchList = {
      patchList: [patch],
    };
    if (!isEmptyObject(flushOptions)) {
      patchList.flushOptions = flushOptions;
    }
    const obj = commitPatchUpdate(patchList, {});

    // Send the update to the native layer
    lynx.getNativeApp().callLepusMethod(LifecycleConstant.patchUpdate, obj, () => {
      const commitTask = globalCommitTaskMap.get(commitTaskId);
      if (commitTask) {
        commitTask();
        globalCommitTaskMap.delete(commitTaskId);
      }
    });

    applyQueuedRefs();
    originalPreactCommit?.(vnode, commitQueue);
  };
  options[COMMIT] = commit as ((...args: Parameters<typeof commit>) => void);
}

/**
 * Prepares the patch update for transmission to the native layer
 */
function commitPatchUpdate(patchList: PatchList, patchOptions: Omit<PatchOptions, 'reloadVersion'>): {
  data: string;
  patchOptions: PatchOptions;
} {
  // console.debug('********** JS update:');
  // printSnapshotInstance(
  //   (backgroundSnapshotInstanceManager.values.get(1) ?? backgroundSnapshotInstanceManager.values.get(-1))!,
  // );
  // console.debug('commitPatchUpdate:', prettyFormatSnapshotPatch(patchList.patchList[0]?.snapshotPatch));

  if (__PROFILE__) {
    console.profile('commitChanges');
  }
  markTiming('packChangesStart');
  const obj: {
    data: string;
    patchOptions: PatchOptions;
  } = {
    data: JSON.stringify(patchList),
    patchOptions: {
      ...patchOptions,
      reloadVersion: getReloadVersion(),
    },
  };
  markTiming('packChangesEnd');
  if (globalPipelineOptions) {
    obj.patchOptions.pipelineOptions = globalPipelineOptions;
    setPipeline(undefined);
  }
  if (__PROFILE__) {
    console.profileEnd();
  }

  return obj;
}

/**
 * Generates a unique ID for commit tasks
 */
function genCommitTaskId(): number {
  return nextCommitTaskId++;
}

/**
 * Resets the commit task ID counter
 */
function clearCommitTaskId(): void {
  nextCommitTaskId = 1;
}

/**
 * @internal
 */
export {
  clearCommitTaskId,
  commitPatchUpdate,
  genCommitTaskId,
  globalBackgroundSnapshotInstancesToRemove,
  globalCommitTaskMap,
  globalFlushOptions,
  replaceCommitHook,
  type PatchList,
  type PatchOptions,
};
