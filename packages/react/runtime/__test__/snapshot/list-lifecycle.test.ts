import { afterEach, describe, expect, it, vi } from 'vitest';

import { gRecycleMap, gSignMap } from '../../src/list';
import { snapshotCreateList, snapshotDestroyList } from '../../src/snapshot/list';

describe('snapshot list lifecycle guards', () => {
  const originalLynx = globalThis.lynx;

  afterEach(() => {
    globalThis.lynx = originalLynx;
  });

  it('should skip native listener wiring when lynx is unavailable', () => {
    globalThis.lynx = undefined as never;

    const list = snapshotCreateList(0, {} as never, 0);
    const listID = __GetElementUniqueID(list);

    expect(gSignMap[listID]).toBeDefined();
    expect(gRecycleMap[listID]).toBeDefined();

    snapshotDestroyList({
      __snapshot_def: { slot: [[0, 0]] },
      __elements: [list],
    } as never);

    expect(gSignMap[listID]).toBeUndefined();
    expect(gRecycleMap[listID]).toBeUndefined();
  });

  it('should handle missing destroy callback even when native exists', () => {
    const removeEventListener = vi.fn();
    globalThis.lynx = {
      ...originalLynx,
      getNative: () => ({
        addEventListener: vi.fn(),
        removeEventListener,
      }),
    } as never;

    const list = __CreateList(0, () => null, () => {}, {}, () => []);
    const listID = __GetElementUniqueID(list);

    gSignMap[listID] = new Map();
    gRecycleMap[listID] = new Map();

    snapshotDestroyList({
      __snapshot_def: { slot: [[0, 0]] },
      __elements: [list],
    } as never);

    expect(removeEventListener).not.toHaveBeenCalled();
    expect(gSignMap[listID]).toBeUndefined();
    expect(gRecycleMap[listID]).toBeUndefined();
  });
});
