import { afterEach, describe, expect, it, vi } from 'vitest';
import { options } from 'preact';

import { initGlobalSnapshotPatch, deinitGlobalSnapshotPatch } from '../../src/lifecycle/patch/snapshotPatch';
import {
  beginPipeline,
  PipelineOrigins,
  initTimingAPI,
  setPipeline,
  globalPipelineOptions,
} from '../../src/lynx/performance';
import { ROOT } from '../../src/renderToOpcodes/constants';

describe('lynx performance branch guards', () => {
  const originalRootHook = options[ROOT];
  const originalGeneratePipelineOptions = lynx.performance?._generatePipelineOptions;
  const originalJS = __JS__;

  afterEach(() => {
    options[ROOT] = originalRootHook;
    lynx.performance._generatePipelineOptions = originalGeneratePipelineOptions;
    globalThis.__JS__ = originalJS;
    setPipeline(undefined);
    deinitGlobalSnapshotPatch();
    vi.restoreAllMocks();
  });

  it('beginPipeline is a no-op when no pipeline options are generated', () => {
    lynx.performance._generatePipelineOptions = undefined;

    beginPipeline(false, PipelineOrigins.updateTriggeredByBts);

    expect(globalPipelineOptions).toBeUndefined();
  });

  it('timing helper skips beginPipeline when global pipeline already exists', () => {
    globalThis.__JS__ = true;
    initGlobalSnapshotPatch();

    const generatePipelineOptionsSpy = vi.fn(() => ({ pipelineID: 'new-pipeline' }));
    lynx.performance._generatePipelineOptions = generatePipelineOptionsSpy;

    setPipeline({
      pipelineID: 'existing-pipeline',
      needTimestamps: false,
      pipelineOrigin: PipelineOrigins.updateTriggeredByBts,
      dsl: 'reactLynx',
      stage: 'update',
    } as never);

    initTimingAPI();
    options[ROOT]?.({} as never, {} as never);

    expect(generatePipelineOptionsSpy).not.toHaveBeenCalled();
  });
});
