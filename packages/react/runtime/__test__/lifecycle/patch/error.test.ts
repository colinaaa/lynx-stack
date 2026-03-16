import { afterEach, describe, expect, it } from 'vitest';

import { sendCtxNotFoundEventToBackground } from '../../../src/lifecycle/patch/error';

describe('lifecycle/patch/error', () => {
  const originalGetJSContext = globalThis.lynx.getJSContext;

  afterEach(() => {
    globalThis.lynx.getJSContext = originalGetJSContext;
  });

  it('should throw when getJSContext is unavailable', () => {
    globalThis.lynx.getJSContext = undefined;

    expect(() => sendCtxNotFoundEventToBackground(1)).toThrowError(
      'snapshotPatchApply failed: ctx not found',
    );
  });
});
