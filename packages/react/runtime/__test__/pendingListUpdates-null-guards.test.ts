import { describe, expect, it } from 'vitest';

import { __pendingListUpdates } from '../src/pendingListUpdates';

describe('pendingListUpdates null guards', () => {
  it('clear/clearAttachedLists/flush should no-op when values is null', () => {
    const original = __pendingListUpdates.values;
    __pendingListUpdates.values = null as never;

    expect(() => __pendingListUpdates.clear(1)).not.toThrow();
    expect(() => __pendingListUpdates.clearAttachedLists()).not.toThrow();
    expect(() => __pendingListUpdates.flush()).not.toThrow();

    __pendingListUpdates.values = original;
  });
});
