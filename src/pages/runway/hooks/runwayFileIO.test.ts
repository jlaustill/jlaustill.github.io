import { describe, it, expect } from 'vitest';
import { parseRunwayData, serializeRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

const validData: IRunwayData = {
  cashOnHand: [{ name: 'Checking', amount: 100 }],
  expectedInflows: [],
  payments: [{ name: 'Rent', amount: 1000, day: 1 }],
  deposits: [],
};

describe('parseRunwayData', () => {
  it('parses valid runway.json text', () => {
    expect(parseRunwayData(JSON.stringify(validData))).toEqual(validData);
  });

  it('throws a clear error on invalid JSON', () => {
    expect(() => parseRunwayData('{not json')).toThrow('That file is not valid JSON.');
  });

  it('throws a clear error when a required array field is missing', () => {
    const broken = JSON.stringify({ cashOnHand: [], expectedInflows: [], payments: [] });
    expect(() => parseRunwayData(broken)).toThrow('"deposits" must be an array');
  });
});

describe('serializeRunwayData', () => {
  it('round-trips through parseRunwayData', () => {
    expect(parseRunwayData(serializeRunwayData(validData))).toEqual(validData);
  });

  it('pretty-prints with 2-space indentation', () => {
    expect(serializeRunwayData(validData)).toContain('\n  "cashOnHand"');
  });
});
