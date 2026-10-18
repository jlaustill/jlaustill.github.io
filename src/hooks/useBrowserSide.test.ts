import { describe, it, expect, vi } from 'vitest';
import useBrowserSide from './useBrowserSide';

describe('useBrowserSide', () => {
  it('returns true when window is defined', () => {
    expect(useBrowserSide()).toBe(true);
  });

  it('returns false when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(useBrowserSide()).toBe(false);
    vi.unstubAllGlobals();
  });
});
