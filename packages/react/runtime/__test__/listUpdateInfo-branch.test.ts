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
