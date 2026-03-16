import { describe, expect, it } from 'vitest';

import { SnapshotInstance, backgroundSnapshotInstanceManager, snapshotInstanceManager } from '../../src/snapshot';

describe('snapshot dev guards', () => {
  it('uses non-dev path for manager clear and updateId operations', () => {
    const originalDev = __DEV__;
    const originalBackground = __BACKGROUND__;
    globalThis.__DEV__ = false;
    globalThis.__BACKGROUND__ = false;

    const original = { __id: 21 };
    backgroundSnapshotInstanceManager.values.set(21, original as never);

    try {
      snapshotInstanceManager.clear();
      backgroundSnapshotInstanceManager.updateId(21, 22);
      backgroundSnapshotInstanceManager.clear();

      expect(original.__id).toBe(22);
      expect(backgroundSnapshotInstanceManager.values.size).toBe(0);
    } finally {
      globalThis.__DEV__ = originalDev;
      globalThis.__BACKGROUND__ = originalBackground;
      snapshotInstanceManager.values.clear();
      backgroundSnapshotInstanceManager.values.clear();
    }
  });

  it('throws concise missing snapshot error when __DEV__ is disabled', () => {
    const originalDev = __DEV__;
    globalThis.__DEV__ = false;

    try {
      let thrown: Error | undefined;
      try {
        new SnapshotInstance('__missing_snapshot__');
      } catch (error) {
        thrown = error as Error;
      }

      expect(thrown).toBeDefined();
      expect(thrown!.message).toContain('Snapshot not found: __missing_snapshot__');
      expect(thrown!.message).not.toContain('REACT_ALOG');
    } finally {
      globalThis.__DEV__ = originalDev;
    }
  });
});
