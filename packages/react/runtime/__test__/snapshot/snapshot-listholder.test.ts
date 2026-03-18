import { describe, expect, it } from 'vitest';
import { SnapshotInstance, snapshotManager } from '../../src/snapshot';
import { __pendingListUpdates } from '../../src/pendingListUpdates';

describe('SnapshotInstance ListHolder', () => {
  it('insertBefore and removeChild when __pendingListUpdates.values is null', () => {
    snapshotManager.values.set('mock-list', { slot: [], create: Array as any, isListHolder: true } as any);

    const parent = new SnapshotInstance('mock-list');
    const child1 = new SnapshotInstance('mock-list');

    // Save previous values
    const oldValues = __pendingListUpdates.values;
    __pendingListUpdates.values = null as any;

    try {
      parent.insertBefore(child1);
      expect(parent.__firstChild).toBe(child1);

      parent.removeChild(child1);
      expect(parent.__firstChild).toBe(null);
    } finally {
      __pendingListUpdates.values = oldValues;
    }
  });
});
