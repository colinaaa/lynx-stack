import { createContext as preactCreateContext, createRef as preactCreateRef } from 'preact';
import { lazy as preactLazy } from 'preact/compat';
import { describe, expect, it } from 'vitest';

import {
  __runInJS,
  Component,
  createContext,
  createRef,
  default as legacyRuntime,
  lazy,
  PureComponent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from '../src/legacy-react-runtime/index';
import { ComponentFromReactRuntime } from '../src/compat/lynxComponent';
import * as reactHooks from '../src/hooks/react';

describe('legacy react runtime exports', () => {
  it('should mirror core runtime exports and default export map', () => {
    expect(Component).toBe(ComponentFromReactRuntime);
    expect(PureComponent).toBe(ComponentFromReactRuntime);

    expect(createContext).toBe(preactCreateContext);
    expect(createRef).toBe(preactCreateRef);
    expect(lazy).toBe(preactLazy);

    expect(useState).toBe(reactHooks.useState);
    expect(useReducer).toBe(reactHooks.useReducer);
    expect(useRef).toBe(reactHooks.useRef);
    expect(useEffect).toBe(reactHooks.useEffect);
    expect(useMemo).toBe(reactHooks.useMemo);
    expect(useCallback).toBe(reactHooks.useCallback);

    expect(legacyRuntime.Component).toBe(Component);
    expect(legacyRuntime.PureComponent).toBe(PureComponent);
    expect(legacyRuntime.createContext).toBe(createContext);
    expect(legacyRuntime.createRef).toBe(createRef);
    expect(legacyRuntime.lazy).toBe(lazy);
    expect(legacyRuntime.useState).toBe(useState);
    expect(legacyRuntime.useReducer).toBe(useReducer);
    expect(legacyRuntime.useRef).toBe(useRef);
    expect(legacyRuntime.useEffect).toBe(useEffect);
    expect(legacyRuntime.useMemo).toBe(useMemo);
    expect(legacyRuntime.useCallback).toBe(useCallback);
  });

  it('should return input value from __runInJS', () => {
    expect(__runInJS('hello')).toBe('hello');
    expect(__runInJS(123)).toBe(123);
    expect(__runInJS(null)).toBeNull();
  });
});
