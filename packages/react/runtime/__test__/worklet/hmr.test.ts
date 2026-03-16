import { describe, expect, it } from 'vitest';

import { registerWorkletOnBackground } from '../../src/worklet/hmr';

describe('worklet hmr', () => {
  it('registerWorkletOnBackground should be a no-op', () => {
    expect(() => registerWorkletOnBackground('test', 'hash', () => 'ok')).not.toThrow();
  });
});
