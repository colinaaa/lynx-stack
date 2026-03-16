import { describe, expect, it, vi } from 'vitest';

import { unref, updateRef } from '../../src/snapshot/ref';

describe('snapshot ref branch guards', () => {
  it('unref skips falsy entries but still clears worklet ref sets', () => {
    const snapshot = {
      __worklet_ref_set: new Set([undefined, {}]),
      childNodes: [],
    };

    unref(snapshot as never, false);

    expect(snapshot.__worklet_ref_set.size).toBe(0);
  });

  it('updateRef handles empty-string refs without setting new attributes', () => {
    const originalSetAttribute = __SetAttribute;
    const setAttributeSpy = vi.fn();
    globalThis.__SetAttribute = setAttributeSpy;

    const element = { props: {} };
    const snapshot = {
      __id: 7,
      __values: [''],
      __elements: [element],
    };

    try {
      updateRef(snapshot as never, 0, 'old-ref', 0);

      expect(snapshot.__values[0]).toBe('');
      expect(setAttributeSpy).toHaveBeenCalledWith(element, 'old-ref', undefined);
      expect(setAttributeSpy).not.toHaveBeenCalledWith(element, '', 1);
    } finally {
      globalThis.__SetAttribute = originalSetAttribute;
    }
  });
});
