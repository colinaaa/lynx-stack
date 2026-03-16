import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { options } from 'preact';
import { DIFFED, DOM } from '../../src/renderToOpcodes/constants';
import { initRenderAlog } from '../../src/alog/render';

describe('alog/render branch coverage', () => {
  let originalDiffed: any;
  let originalMainThread: any;
  let originalBackground: any;
  let originalConsoleAlog: any;

  beforeEach(() => {
    originalDiffed = options[DIFFED];
    // @ts-ignore
    originalMainThread = globalThis.__MAIN_THREAD__;
    // @ts-ignore
    originalBackground = globalThis.__BACKGROUND__;
    originalConsoleAlog = console.alog;

    // Clear DIFFED to simulate clean state
    options[DIFFED] = undefined;
  });

  afterEach(() => {
    options[DIFFED] = originalDiffed;
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = originalMainThread;
    // @ts-ignore
    globalThis.__BACKGROUND__ = originalBackground;
    console.alog = originalConsoleAlog;

    vi.restoreAllMocks();
  });

  it('should call oldAfterDiff if present', () => {
    const oldDiffed = vi.fn();
    options[DIFFED] = oldDiffed;

    initRenderAlog();

    const vnode = { type: 'div' } as any;
    options[DIFFED] && options[DIFFED](vnode);

    expect(oldDiffed).toHaveBeenCalledWith(vnode);
  });

  it('should handle missing oldAfterDiff gracefully', () => {
    options[DIFFED] = undefined;

    initRenderAlog();

    const vnode = { type: 'div' } as any;
    expect(() => options[DIFFED] && options[DIFFED](vnode)).not.toThrow();
  });

  it('should log on MainThread when console.alog exists', () => {
    console.alog = vi.fn();
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = true;
    // @ts-ignore
    globalThis.__BACKGROUND__ = false;

    initRenderAlog();

    function MyComp() {}
    const vnode = { type: MyComp } as any;
    options[DIFFED] && options[DIFFED](vnode);

    expect(console.alog).toHaveBeenCalledWith(expect.stringContaining('[MainThread Component Render] name: MyComp'));
  });

  it('should not throw on MainThread when console.alog is missing', () => {
    // @ts-ignore
    console.alog = undefined;
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = true;
    // @ts-ignore
    globalThis.__BACKGROUND__ = false;

    initRenderAlog();

    function MyComp() {}
    const vnode = { type: MyComp } as any;

    expect(() => options[DIFFED] && options[DIFFED](vnode)).not.toThrow();
  });

  it('should log on BackgroundThread when console.alog exists', () => {
    console.alog = vi.fn();
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false;
    // @ts-ignore
    globalThis.__BACKGROUND__ = true;

    initRenderAlog();

    function MyComp() {}
    const vnode = {
      type: MyComp,
      [DOM]: { type: 'view', __id: 123 },
    } as any;

    options[DIFFED] && options[DIFFED](vnode);

    expect(console.alog).toHaveBeenCalledWith(
      expect.stringContaining('[BackgroundThread Component Render] name: MyComp'),
    );
    expect(console.alog).toHaveBeenCalledWith(expect.stringContaining('uniqID: view'));
    expect(console.alog).toHaveBeenCalledWith(expect.stringContaining('__id: 123'));
  });

  it('should not throw on BackgroundThread when console.alog is missing', () => {
    // @ts-ignore
    console.alog = undefined;
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false;
    // @ts-ignore
    globalThis.__BACKGROUND__ = true;

    initRenderAlog();

    function MyComp() {}
    const vnode = {
      type: MyComp,
      [DOM]: { type: 'view', __id: 123 },
    } as any;

    expect(() => options[DIFFED] && options[DIFFED](vnode)).not.toThrow();
  });

  it('should handle undefined DOM on BackgroundThread gracefully', () => {
    console.alog = vi.fn();
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false;
    // @ts-ignore
    globalThis.__BACKGROUND__ = true;

    initRenderAlog();

    function MyComp() {}
    const vnode = {
      type: MyComp,
      // [DOM] is undefined
    } as any;

    expect(() => options[DIFFED] && options[DIFFED](vnode)).not.toThrow();
    // Should log something with undefined
    expect(console.alog).toHaveBeenCalledWith(expect.stringContaining('uniqID: undefined'));
  });

  it('should do nothing if neither MainThread nor BackgroundThread', () => {
    console.alog = vi.fn();
    // @ts-ignore
    globalThis.__MAIN_THREAD__ = false;
    // @ts-ignore
    globalThis.__BACKGROUND__ = false;

    initRenderAlog();

    function MyComp() {}
    const vnode = { type: MyComp } as any;

    options[DIFFED] && options[DIFFED](vnode);

    expect(console.alog).not.toHaveBeenCalled();
  });
});
