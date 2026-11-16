import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { getNextMonthlyDate, getNextWeeklyDate, lastDayOfMonth, parseIsoDate } from './calendar';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);

describe('getNextMonthlyDate', () => {
  it('uses this month if the day has not passed', () => {
    expect(getNextMonthlyDate(13, date('2026-09-08')).toString()).toBe('2026-09-13');
  });

  it('rolls to next month if the day has passed', () => {
    expect(getNextMonthlyDate(13, date('2026-09-20')).toString()).toBe('2026-10-13');
  });

  it('clamps to the last day of a short month', () => {
    expect(getNextMonthlyDate(31, date('2026-02-01')).toString()).toBe('2026-02-28');
  });

  it('counts the day itself', () => {
    expect(getNextMonthlyDate(8, date('2026-09-08')).toString()).toBe('2026-09-08');
  });
});

describe('getNextWeeklyDate', () => {
  it('finds the next occurrence of an ISO weekday', () => {
    // 2026-09-08 is a Tuesday; 5 is Friday
    expect(getNextWeeklyDate(5, date('2026-09-08')).toString()).toBe('2026-09-11');
  });

  it('counts the day itself', () => {
    expect(getNextWeeklyDate(2, date('2026-09-08')).toString()).toBe('2026-09-08');
  });
});

describe('parseIsoDate', () => {
  it('reads a real YYYY-MM-DD date', () => {
    expect(parseIsoDate('2027-02-10')?.toString()).toBe('2027-02-10');
  });

  it.each([[''], [null], [42], ['2027-02-30'], ['2027-2-1']])('treats %j as no date', (value) => {
    expect(parseIsoDate(value)).toBeNull();
  });
});

describe('lastDayOfMonth', () => {
  it('finds the last day of a YYYY-MM month', () => {
    expect(lastDayOfMonth('2027-02')?.toString()).toBe('2027-02-28');
    expect(lastDayOfMonth('2028-02')?.toString()).toBe('2028-02-29');
  });

  it.each([['~2029'], ['2027-13'], [null]])('treats %j as no month', (value) => {
    expect(lastDayOfMonth(value)).toBeNull();
  });
});
