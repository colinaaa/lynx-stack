import { describe, expect, it, vi } from 'vitest';

import { processGesture } from '../../src/gesture/processGesture';
import { updateGesture } from '../../src/snapshot/gesture';

vi.mock('../../src/gesture/processGesture', () => ({
  processGesture: vi.fn(),
}));

describe('snapshot/gesture branch guards', () => {
  it('should skip processGesture for non main-thread worklet type', () => {
    const snapshot = {
      __elements: [{}],
      __values: [{}],
    };

    updateGesture(snapshot as never, 0, undefined, 0, 'background-thread');

    expect(processGesture).not.toHaveBeenCalled();
  });
});
