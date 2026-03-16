import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { setupDocument } from '../src/document';
import { renderOpcodesInto } from '../src/opcodes';
import { setupPage, SnapshotInstance, snapshotInstanceManager } from '../src/snapshot';
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
});
