import { describe, expect, it } from 'vitest';
import { SnapshotInstance, snapshotManager } from '../../src/snapshot';
import { elementTree } from '../utils/nativeMethod';

describe('SnapshotInstance DOM methods', () => {
  it('contains and childNodes', () => {
    snapshotManager.values.set('mock-div', { slot: [[0, 0]], create: Array as any } as any);

    const parent = new SnapshotInstance('mock-div');
    const child1 = new SnapshotInstance('mock-div');
    const child2 = new SnapshotInstance('mock-div');

    parent.__firstChild = child1;
    child1.__nextSibling = child2;
    child1.__parent = parent;
    child2.__parent = parent;

    expect(parent.contains(child1)).toBe(true);
    expect(parent.contains(new SnapshotInstance('mock-div'))).toBe(false);

    const nodes = parent.childNodes;
    expect(nodes.length).toBe(2);
    expect(nodes[0]).toBe(child1);
    expect(nodes[1]).toBe(child2);
  });

  it('insertBefore and removeChild with MultiChildren (count > 1)', () => {
    snapshotManager.values.set('multi-div', {
      slot: [[2, 0], [2, 0]], // 2 is Slot
      create: () => {
        const root = elementTree.__CreateElement('view', 0, {});
        const child = elementTree.__CreateElement('view', 0, {});
        elementTree.__AppendElement(root, child);
        return [child];
      },
      isListHolder: false,
    } as any);

    const parent = new SnapshotInstance('multi-div');
    parent.__elements = parent.__snapshot_def.create();

    const child1 = new SnapshotInstance('multi-div');
    child1.__elements = child1.__snapshot_def.create();
    child1.__element_root = child1.__elements[0];

    // Trigger insertBefore with count > 1
    parent.insertBefore(child1);

    // Test that index increased
    expect(parent.__current_slot_index).toBe(1);

    // Test removeChild with count > 1
    parent.removeChild(child1);
  });

  it('insertBefore with count === 0', () => {
    snapshotManager.values.set('multi-div-0', {
      slot: [], // count === 0
      create: () => [],
      isListHolder: false,
    } as any);

    const parent = new SnapshotInstance('multi-div-0');
    parent.__elements = [];

    const child1 = new SnapshotInstance('multi-div-0');
    child1.__elements = [];

    // Trigger insertBefore with count === 0
    parent.insertBefore(child1);
  });
});
