import { describe, expect, it, vi } from 'vitest';

describe('snapshot module init branch guards', () => {
  it('does not install snapshotCreatorMap dev proxy when __JS__ is false', async () => {
    const originalDev = __DEV__;
    const originalJs = __JS__;

    vi.resetModules();
    globalThis.__DEV__ = true;
    globalThis.__JS__ = false;

    try {
      const patchModule = await import('../../src/lifecycle/patch/snapshotPatch');
      const snapshotModule = await import('../../src/snapshot');

      patchModule.initGlobalSnapshotPatch();

      const key = '__snapshot_module_branch__';
      snapshotModule.snapshotCreatorMap[key] = (id: string) => id;

      const patch = patchModule.takeGlobalSnapshotPatch();
      expect(patch).toEqual([]);

      delete snapshotModule.snapshotCreatorMap[key];
      patchModule.deinitGlobalSnapshotPatch();
    } finally {
      globalThis.__DEV__ = originalDev;
      globalThis.__JS__ = originalJs;
      vi.resetModules();
    }
  });
});
