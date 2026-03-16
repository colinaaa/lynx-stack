import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createElement } from '../lepus';
import { setupDocument } from '../src/document';
import { renderOpcodesInto, ssrHydrateByOpcodes } from '../src/opcodes';
import { createSnapshot, setupPage, SnapshotInstance, snapshotInstanceManager } from '../src/snapshot';
import { DynamicPartType } from '../src/snapshot/dynamicPartType';
import { elementTree } from './utils/nativeMethod';

describe('opcodes branch guards', () => {
  let scratch: SnapshotInstance;
  const originalEnableSSR = __ENABLE_SSR__;

  beforeAll(() => {
    setupDocument();
  });

  beforeEach(() => {
    setupPage(__CreatePage('0', 0));
    scratch = document.createElement('root');
    scratch.ensureElements();
  });

  afterEach(() => {
    // @ts-expect-error restore test flag
    globalThis.__ENABLE_SSR__ = originalEnableSSR;
    elementTree.clear();
    snapshotInstanceManager.clear();
  });

  it('renderOpcodesInto should keep text payload unchanged when __ENABLE_SSR__ is false', () => {
    // @ts-expect-error test branch flag
    globalThis.__ENABLE_SSR__ = false;

    const opcodes = [3, 'plain-text'];
    renderOpcodesInto(opcodes, scratch);

    expect(opcodes[1]).toBe('plain-text');
  });

  it('ssrHydrateByOpcodes should skip list child enqueue when child has no element root', () => {
    const listType = '__test_ssr_list_holder__';
    const childType = '__test_ssr_child__';

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
      childType,
      (ctx) => [__CreateElement('view', ctx.__id)],
      null,
      [],
      0,
      undefined,
      null,
    );

    const listElement = __CreateList(0);
    const opcodes = [
      0,
      [listType, 100, [{ ssrID: 'list' }]],
      0,
      [childType, 101, [{ ssrID: 'missing-child' }]],
      1,
      1,
    ];

    ssrHydrateByOpcodes(opcodes, scratch, {
      list: listElement,
    } as never);

    expect(scratch.childNodes[0]?.childNodes[0]?.__element_root).toBeUndefined();
  });

  it('createElement should preserve explicitly provided props when defaultProps exist', () => {
    const Counter = (() => null) as ((props: { count?: number; label?: string }) => null) & {
      defaultProps?: { count: number; label: string };
    };
    Counter.defaultProps = {
      count: 1,
      label: 'fallback',
    };

    const vnode = createElement(Counter, {
      count: 2,
    });

    expect(vnode.props.count).toBe(2);
    expect(vnode.props.label).toBe('fallback');
  });
});
