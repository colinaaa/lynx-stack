import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateSpread } from '../../src/snapshot/spread';
import { __pendingListUpdates } from '../../src/pendingListUpdates';
import { isDirectOrDeepEqual } from '../../src/utils';

describe('snapshot/spread branch coverage', () => {
  it('returns early if snapshot.__elements is missing', () => {
    const snapshot = {
      __values: { 0: { id: 'test' } },
      __elements: undefined,
      parentNode: null,
    } as any;

    expect(() => updateSpread(snapshot, 0, {}, 0)).not.toThrow();
  });

  it('handles list holder update when __pendingListUpdates.values is undefined', () => {
    const list = {
      __id: 1,
      __snapshot_def: { isListHolder: true },
    } as any;

    const snapshot = {
      __id: 2,
      __values: { 0: { 'item-key': 'new' } },
      __elements: [{ props: {} }],
      parentNode: list,
      __listItemPlatformInfo: { 'item-key': 'old' },
    } as any;

    const originalValues = __pendingListUpdates.values;
    // @ts-ignore
    __pendingListUpdates.values = undefined;

    updateSpread(snapshot, 0, { 'item-key': 'old' }, 0);

    // Should update __listItemPlatformInfo
    expect(snapshot.__listItemPlatformInfo).toEqual({ 'item-key': 'new' });

    // Restore
    // @ts-ignore
    __pendingListUpdates.values = originalValues;
  });

  it('skips list-holder platform-info work when old/new platform info are equal', () => {
    const list = {
      __id: 1,
      __snapshot_def: { isListHolder: true },
    } as any;

    const snapshot = {
      __id: 2,
      __values: { 0: { 'item-key': 'same' } },
      __elements: [{ props: {} }],
      parentNode: list,
      __listItemPlatformInfo: { 'item-key': 'same' },
    } as any;

    updateSpread(snapshot, 0, { 'item-key': 'same' }, 0);

    expect(snapshot.__listItemPlatformInfo).toEqual({ 'item-key': 'same' });
  });

  it('handles style update with deep equality check', () => {
    const snapshot = {
      __id: 1,
      __values: { 0: { style: { color: 'red' } } },
      __elements: [{ props: { style: { color: 'red' } } }],
      parentNode: null,
    } as any;

    // Mock __SetInlineStyles to verify call
    const originalSetInlineStyles = globalThis.__SetInlineStyles;
    const setInlineStyles = vi.fn();
    // @ts-ignore
    globalThis.__SetInlineStyles = setInlineStyles;

    // Same style, should skip __SetInlineStyles
    updateSpread(snapshot, 0, { style: { color: 'red' } }, 0);
    expect(setInlineStyles).not.toHaveBeenCalled();

    // Different style
    snapshot.__values![0] = { style: { color: 'blue' } };
    updateSpread(snapshot, 0, { style: { color: 'red' } }, 0);
    expect(setInlineStyles).toHaveBeenCalledWith(snapshot.__elements[0], { color: 'blue' });

    // Restore
    // @ts-ignore
    globalThis.__SetInlineStyles = originalSetInlineStyles;
  });
});
