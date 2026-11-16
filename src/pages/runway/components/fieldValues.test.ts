import { describe, expect, it } from 'vitest';
import { blankToNull, numberOrZero, parseNumber } from './fieldValues';

describe('parseNumber', () => {
  it('reads a typed number', () => {
    expect(parseNumber('22.5')).toBe(22.5);
    expect(parseNumber('0')).toBe(0);
  });

  it('gives null for an empty field or text that is not a number', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});

describe('numberOrZero', () => {
  it('reads a typed number', () => {
    expect(numberOrZero('1250')).toBe(1250);
  });

  it('gives 0, never a string, for an empty field or text that is not a number', () => {
    expect(numberOrZero('')).toBe(0);
    expect(numberOrZero('abc')).toBe(0);
  });
});

describe('blankToNull', () => {
  it('keeps typed text exactly', () => {
    expect(blankToNull('~2031')).toBe('~2031');
  });

  it('gives null for an empty field', () => {
    expect(blankToNull('')).toBeNull();
  });
});
