import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { hydrate } from '../src/hydrate';
import { gRecycleMap, gSignMap } from '../src/list';
import { __pendingListUpdates } from '../src/pendingListUpdates';
import { createSnapshot, SnapshotInstance, snapshotInstanceManager } from '../src/snapshot';
import { DynamicPartType } from '../src/snapshot/dynamicPartType';

describe('hydrate list branch guards', () => {
  const listType = '__hydrate_list_branch__';
  const itemType = '__hydrate_item_branch__';

  beforeEach(() => {
    __pendingListUpdates.clearAttachedLists();
    snapshotInstanceManager.clear();
    snapshotInstanceManager.nextId = 0;

    createSnapshot(
      listType,
      (ctx) => [__CreateList(ctx.__id)],
      null,
      [[DynamicPartType.ListChildren, 0]],
      0,
      undefined,
      null,
    );
    createSnapshot(
      itemType,
      (ctx) => [__CreateElement('view', ctx.__id)],
      null,
      [],
      0,
      undefined,
      null,
    );
  });

  afterEach(() => {
    snapshotInstanceManager.clear();
  });

  it('skips signMap update when list item id is missing from signMap', () => {
    const beforeList = new SnapshotInstance(listType);
    beforeList.ensureElements();

    const beforeItem = new SnapshotInstance(itemType);
    beforeItem.__listItemPlatformInfo = { 'item-key': 'k1' } as never;
    beforeList.insertBefore(beforeItem);
    beforeItem.ensureElements();

    const afterList = new SnapshotInstance(listType);
    const afterItem = new SnapshotInstance(itemType);
    afterItem.__listItemPlatformInfo = { 'item-key': 'k1' } as never;
    afterList.insertBefore(afterItem);

    const listID = __GetElementUniqueID(beforeList.__element_root!);
    gSignMap[listID] = new Map();
    gRecycleMap[listID] = new Map();

    expect(() => hydrate(beforeList, afterList)).not.toThrow();
  });
});
