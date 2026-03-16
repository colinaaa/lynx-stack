import { afterEach, describe, expect, it, vi } from 'vitest';

import { removeCtxNotFoundEventListener, reportCtxNotFound } from '../../../src/lifecycle/patch/error';

describe('lifecycle/patch/error branches', () => {
  const originalDev = __DEV__;
  const originalGetCoreContext = globalThis.lynx.getCoreContext;
  const originalReportError = globalThis.lynx.reportError;

  afterEach(() => {
    // @ts-expect-error restore test flag
    globalThis.__DEV__ = originalDev;
    globalThis.lynx.getCoreContext = originalGetCoreContext;
    globalThis.lynx.reportError = originalReportError;
  });

  it('reportCtxNotFound should omit troubleshooting suffix when __DEV__ is false', () => {
    const reportError = vi.fn();
    // @ts-expect-error test flag branch
    globalThis.__DEV__ = false;
    globalThis.lynx.reportError = reportError;

    reportCtxNotFound({ id: 12345 });

    expect(reportError).toHaveBeenCalledTimes(1);
    const err = reportError.mock.calls[0]?.[0] as Error;
    expect(err.message).toContain('snapshotPatchApply failed: ctx not found, snapshot type: \'null\'');
    expect(err.message).not.toContain('REACT_ALOG=true');
  });

  it('removeCtxNotFoundEventListener should no-op when core context is unavailable', () => {
    globalThis.lynx.getCoreContext = () => undefined;
    expect(() => removeCtxNotFoundEventListener()).not.toThrow();
  });
});
