import { describe, expect, it, vi } from 'vitest';

import { ListUpdateInfoRecording } from '../src/listUpdateInfo';

describe('ListUpdateInfoRecording branch guards', () => {
  it('flushes without profile hooks when __PROFILE__ is false', () => {
    const originalProfile = __PROFILE__;
    globalThis.__PROFILE__ = false;

    const originalSetAttribute = __SetAttribute;
    const originalUpdateListCallbacks = __UpdateListCallbacks;

    const setAttributeSpy = vi.fn();
    const updateListCallbacksSpy = vi.fn();
    globalThis.__SetAttribute = setAttributeSpy;
    globalThis.__UpdateListCallbacks = updateListCallbacksSpy;

    const listElement = { props: {} };
    const list = {
      __id: 9,
      __elements: [listElement],
      __snapshot_def: { slot: [[0, 0]] },
      childNodes: [],
      type: 'list',
    };

    try {
      const info = new ListUpdateInfoRecording(list as never);
      expect(info.flush()).toBe(9);
      expect(setAttributeSpy).toHaveBeenCalledWith(listElement, 'update-list-info', {
        insertAction: [],
        removeAction: [],
        updateAction: [],
      });
      expect(updateListCallbacksSpy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.__PROFILE__ = originalProfile;
      globalThis.__SetAttribute = originalSetAttribute;
      globalThis.__UpdateListCallbacks = originalUpdateListCallbacks;
    }
  });

  it('keeps incremental updates when custom-list-name is not list-container', () => {
    const originalSdkVersion = SystemInfo.lynxSdkVersion;
    const originalGetAttributeByName = __GetAttributeByName;

    SystemInfo.lynxSdkVersion = '2.14';
    globalThis.__GetAttributeByName = vi.fn(() => 'plain-list');

    const listElement = { props: {} };
    const child = { type: 'item' };
    const list = {
      __id: 10,
      __elements: [listElement],
      __snapshot_def: { slot: [[0, 0]] },
      childNodes: [child],
      type: 'list',
    };

    try {
      const info = new ListUpdateInfoRecording(list as never);
      const [result] = info.toJSON();

      expect(result.updateAction).toEqual([]);
    } finally {
      SystemInfo.lynxSdkVersion = originalSdkVersion;
      globalThis.__GetAttributeByName = originalGetAttributeByName;
    }
  });
});

it('sorts multiple insertions and removals correctly', () => {
  const originalSdkVersion = SystemInfo.lynxSdkVersion;
  const originalGetAttributeByName = __GetAttributeByName;

  SystemInfo.lynxSdkVersion = '2.14';
  globalThis.__GetAttributeByName = vi.fn(() => 'list-container');

  const listElement = { props: {} };
  const child1 = { type: 'item1', __listItemPlatformInfo: { 'item-key': '1' } };
  const child2 = { type: 'item2', __listItemPlatformInfo: { 'item-key': '2' } };
  const child3 = { type: 'item3', __listItemPlatformInfo: { 'item-key': '3' } };
  const list = {
    __id: 11,
    __elements: [listElement],
    __snapshot_def: { slot: [[0, 0]] },
    childNodes: [child1, child2, child3],
    type: 'list',
  };

  try {
    const info = new ListUpdateInfoRecording(list as never);

    // Trigger multiple removals
    info.onRemoveChild(child1 as never);
    info.onRemoveChild(child3 as never);

    // Trigger multiple appendChild insertions
    const newChild1 = { type: 'new1', __listItemPlatformInfo: { 'item-key': 'new1' } };
    const newChild2 = { type: 'new2', __listItemPlatformInfo: { 'item-key': 'new2' } };
    info.onInsertBefore(newChild1 as never);
    info.onInsertBefore(newChild2 as never);

    const [result] = info.toJSON();

    expect(result.removeAction).toEqual([0, 2]);
    expect(result.insertAction[0].type).toBe('new1');
    expect(result.insertAction[1].type).toBe('new2');
  } finally {
    SystemInfo.lynxSdkVersion = originalSdkVersion;
    globalThis.__GetAttributeByName = originalGetAttributeByName;
  }
});
