import { describe, expect, it } from 'vitest';
import { roundToCents } from './money';

describe('roundToCents', () => {
  it('removes floating-point noise', () => {
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });

  it('rounds to the nearest cent', () => {
    expect(roundToCents(10.126)).toBe(10.13);
    expect(roundToCents(10.124)).toBe(10.12);
  });

  it('keeps negative amounts negative', () => {
    expect(roundToCents(-2.5)).toBe(-2.5);
  });
});
