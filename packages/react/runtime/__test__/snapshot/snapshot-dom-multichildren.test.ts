import { describe, expect, it } from 'vitest';
import { SnapshotInstance, snapshotManager } from '../../src/snapshot';
import { elementTree } from '../utils/nativeMethod';

describe('SnapshotInstance DOM methods', () => {
  it('insertBefore and removeChild with MultiChildren (type = 5)', () => {
    snapshotManager.values.set('multi-div-type-5', {
      slot: [[5, 0], [5, 0]], // 5 is MultiChildren
      create: () => {
        const root = elementTree.__CreateElement('view', 0, {});
        return [root];
      },
      isListHolder: false,
    } as any);

    const parent = new SnapshotInstance('multi-div-type-5');
    parent.__elements = parent.__snapshot_def.create();

    const child1 = new SnapshotInstance('multi-div-type-5');
    child1.__elements = child1.__snapshot_def.create();
    child1.__element_root = child1.__elements[0];

    // Trigger else branch of tag === wrapper
    parent.insertBefore(child1);

    parent.__current_slot_index = 0;
    parent.removeChild(child1);

    // Now test with wrapper element
    const wrapperParent = new SnapshotInstance('multi-div-type-5');
    wrapperParent.__elements = [elementTree.__CreateElement('wrapper', 0, {})];

    // Create an element that has the wrapperParent's wrapper as a child
    const root2 = elementTree.__CreateElement('view', 0, {});
    elementTree.__AppendElement(root2, wrapperParent.__elements[0]);

    wrapperParent.insertBefore(child1); // goes into if tag === 'wrapper'
  });
});

it('insertBefore with unknown type (e.g. Children) to hit the implicit else', () => {
  snapshotManager.values.set('multi-div-type-3', {
    slot: [[3, 0], [3, 0]], // 3 is Children
    create: () => {
      const root = elementTree.__CreateElement('view', 0, {});
      return [root];
    },
    isListHolder: false,
  } as any);

  const parent = new SnapshotInstance('multi-div-type-3');
  parent.__elements = parent.__snapshot_def.create();

  const child1 = new SnapshotInstance('multi-div-type-3');
  child1.__elements = child1.__snapshot_def.create();
  child1.__element_root = child1.__elements[0];

  // Trigger else branch of s === MultiChildren
  parent.insertBefore(child1);
});
