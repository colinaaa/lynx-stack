import { describe, expect, it } from 'vitest';

import { isDirectOrDeepEqual } from '../../src/utils';

describe('isDirectOrDeepEqual branch guards', () => {
  it('handles circular stringify errors even when no current vnode is available', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(() => isDirectOrDeepEqual(circular, {})).toThrow(/circular|cyclic/i);
  });

  it('skips circular stack enrichment when __DEV__ is disabled', () => {
    const originalDev = __DEV__;
    globalThis.__DEV__ = false;

    const circular: { self?: unknown } = {};
    circular.self = circular;

    try {
      expect(() => isDirectOrDeepEqual(circular, {})).toThrow(/circular|cyclic/i);
    } finally {
      globalThis.__DEV__ = originalDev;
    }
  });
});
