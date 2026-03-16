import { describe, expect, it } from 'vitest';

import { snapshotCreatorMap } from '../../../src/snapshot';
import { snapshotPatchApply } from '../../../src/lifecycle/patch/snapshotPatchApply';
import { SnapshotOperation } from '../../../src/lifecycle/patch/snapshotPatch';

describe('snapshotPatchApply dev-only operation guards', () => {
  it('ignores DEV_ONLY operations when __DEV__ is false', () => {
    const originalDev = __DEV__;
    globalThis.__DEV__ = false;

    const addKey = '__dev_only_add_snapshot__';
    const entryKey = '__dev_only_set_entry__';

    delete snapshotCreatorMap[addKey];
    snapshotCreatorMap[entryKey] = (id: string) => id;

    try {
      snapshotPatchApply([
        SnapshotOperation.DEV_ONLY_AddSnapshot,
        addKey,
        '(id) => id + "-dev"',
        SnapshotOperation.DEV_ONLY_SetSnapshotEntryName,
        entryKey,
        '__Entry__',
      ]);

      expect(snapshotCreatorMap[addKey]).toBeUndefined();
      expect(snapshotCreatorMap[entryKey]!('x')).toBe('x');
    } finally {
      globalThis.__DEV__ = originalDev;
      delete snapshotCreatorMap[addKey];
      delete snapshotCreatorMap[entryKey];
    }
  });
});
