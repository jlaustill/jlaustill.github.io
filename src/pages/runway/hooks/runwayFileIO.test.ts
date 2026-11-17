import { describe, it, expect } from 'vitest';
import { parseRunwayData, serializeRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

const validData: IRunwayData = {
  cashOnHand: [{ name: 'Checking', amount: 100 }],
  payments: [{ name: 'Rent', amount: 1000, day: 1 }],
  recurringIncome: [{ name: 'Salary', amount: 2000, schedule: 'semi-monthly', days: [1, 15] }],
  expectedInflows: [],
};

describe('parseRunwayData', () => {
  it('parses valid runway.json text', () => {
    expect(parseRunwayData(JSON.stringify(validData))).toEqual(validData);
  });

  it('treats missing income and inflow lists as empty', () => {
    const minimal = JSON.stringify({ cashOnHand: [], payments: [] });
    expect(parseRunwayData(minimal)).toEqual({ cashOnHand: [], payments: [], recurringIncome: [], expectedInflows: [] });
  });

  it('throws a clear error on invalid JSON', () => {
    expect(() => parseRunwayData('{not json')).toThrow('That file is not valid JSON.');
  });

  it('throws a clear error when a required list is missing', () => {
    expect(() => parseRunwayData(JSON.stringify({ cashOnHand: [] }))).toThrow('"payments" must be an array');
  });

  it('throws a clear error when an optional list is not a list', () => {
    const broken = JSON.stringify({ cashOnHand: [], payments: [], recurringIncome: {} });
    expect(() => parseRunwayData(broken)).toThrow('"recurringIncome" must be an array');
  });

  it('throws a clear error when the file is not a JSON object', () => {
    expect(() => parseRunwayData('null')).toThrow('"cashOnHand" must be an array');
  });
});

describe('serializeRunwayData', () => {
  it('keeps keys the page does not know about', () => {
    const withExtra = { ...validData, extraTopLevelKey: { kept: true } };
    expect(parseRunwayData(serializeRunwayData(withExtra))).toEqual(withExtra);
  });

  it('pretty-prints with 2-space indentation and ends with a newline', () => {
    const text = serializeRunwayData(validData);
    expect(text).toContain('\n  "cashOnHand"');
    expect(text.endsWith('}\n')).toBe(true);
  });
});
