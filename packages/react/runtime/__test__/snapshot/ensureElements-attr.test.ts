import { describe, expect, it } from 'vitest';
import { SnapshotInstance, snapshotManager } from '../../src/snapshot';
import { elementTree } from '../utils/nativeMethod';

describe('ensureElements missing branches', () => {
  it('handles Attr, Spread, and unknown in switch', () => {
    // 0 is Attr
    snapshotManager.values.set('switch-attr', {
      slot: [[0, 0]],
      create: () => [elementTree.__CreateElement('view', 0, {})],
      isListHolder: false,
    } as any);

    // 1 is Spread
    snapshotManager.values.set('switch-spread', {
      slot: [[1, 0]],
      create: () => [elementTree.__CreateElement('view', 0, {})],
      isListHolder: false,
    } as any);

    // 99 is unknown
    snapshotManager.values.set('switch-unknown', {
      slot: [[99, 0]],
      create: () => [elementTree.__CreateElement('view', 0, {})],
      isListHolder: false,
    } as any);

    const parentAttr = new SnapshotInstance('switch-attr');
    parentAttr.insertBefore(new SnapshotInstance('switch-attr'));
    parentAttr.__elements = undefined;
    parentAttr.ensureElements();

    const parentSpread = new SnapshotInstance('switch-spread');
    parentSpread.insertBefore(new SnapshotInstance('switch-spread'));
    parentSpread.__elements = undefined;
    parentSpread.ensureElements();

    const parentUnknown = new SnapshotInstance('switch-unknown');
    parentUnknown.insertBefore(new SnapshotInstance('switch-unknown'));
    parentUnknown.__elements = undefined;
    parentUnknown.ensureElements();

    expect(parentAttr.__elements).toBeDefined();
    expect(parentSpread.__elements).toBeDefined();
    expect(parentUnknown.__elements).toBeDefined();
  });

  it('handles Slot and Children in switch', () => {
    snapshotManager.values.set('switch-slot', {
      slot: [[2, 1]], // 2 is Slot, index 1
      create: () => {
        const root = elementTree.__CreateElement('view', 0, {});
        const child = elementTree.__CreateElement('view', 0, {});
        elementTree.__AppendElement(root, child);
        return [root, child]; // return array where element 1 has a parent
      },
      isListHolder: false,
    } as any);

    const parentSlot = new SnapshotInstance('switch-slot');
    parentSlot.insertBefore(new SnapshotInstance('switch-slot'));
    parentSlot.__elements = undefined;
    parentSlot.ensureElements();

    snapshotManager.values.set('switch-children', {
      slot: [[3, 0]], // 3 is Children
      create: () => [elementTree.__CreateElement('view', 0, {})],
      isListHolder: false,
    } as any);

    const parentChildren = new SnapshotInstance('switch-children');
    parentChildren.insertBefore(new SnapshotInstance('switch-children'));
    parentChildren.__elements = undefined;
    parentChildren.ensureElements();
  });

  it('handles ListChildren in switch', () => {
    snapshotManager.values.set('switch-listchildren', {
      slot: [[4, 0]], // 4 is ListChildren
      create: () => [elementTree.__CreateElement('view', 0, {})],
      isListHolder: false,
    } as any);

    const parentListChildren = new SnapshotInstance('switch-listchildren');
    parentListChildren.insertBefore(new SnapshotInstance('switch-listchildren'));
    parentListChildren.__elements = undefined;
    parentListChildren.ensureElements();
  });
});
