import { describe, expect, it } from 'vitest';
import { SnapshotInstance, snapshotManager } from '../../src/snapshot';

describe('SnapshotInstance DOM methods', () => {
  it('contains and childNodes', () => {
    snapshotManager.values.set('mock-div', { slot: [], create: Array as any } as any);

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
      slot: [[0, 0], [1, 0]],
      create: () => [{}],
      isListHolder: false,
    } as any);

    const parent = new SnapshotInstance('multi-div');
    parent.__elements = [{ children: [] }] as any;

    const child1 = new SnapshotInstance('multi-div');
    child1.__elements = [{ children: [] }] as any;
    child1.__element_root = { children: [] } as any;

    const child2 = new SnapshotInstance('multi-div');
    child2.__elements = [{ children: [] }] as any;
    child2.__element_root = { children: [] } as any;

    // Trigger insertBefore with count > 1
    parent.insertBefore(child1);

    // Test that index increased
    expect(parent.__current_slot_index).toBe(1);

    // Test removeChild with count > 1
    parent.removeChild(child1);
  });
});
