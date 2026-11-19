import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { CHECK_IN_DAYS, scheduleWindow, withRunningBalance } from './window';
import type { IRunwayResult } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-11-19'); // 60 days later is 2027-01-18

const result = (
  startingBalance: number,
  rows: [string, string, number][],
  runwayEndDate: string | null = null,
): IRunwayResult => ({
  startingBalance,
  scheduled: rows.map(([isoDate, name, amount]) => ({ date: date(isoDate), name, amount })),
  runwayEndDate: runwayEndDate ? date(runwayEndDate) : null,
  stoppedAtName: runwayEndDate ? 'Bill' : null,
  lowestBalance: { amount: startingBalance, date: today },
  payoffs: [],
});

describe('withRunningBalance', () => {
  it('carries a running balance from the starting balance, rounded to cents', () => {
    const rows = withRunningBalance(result(100.1, [['2026-11-20', 'Refund', 0.2], ['2026-11-21', 'Power', -50]]));
    expect(rows.map((row) => row.balance)).toEqual([100.3, 50.3]);
  });
});

describe('scheduleWindow', () => {
  it('keeps rows through the last day of the window and drops the day after', () => {
    const window = scheduleWindow(
      result(1000, [['2027-01-18', 'Last day', -10], ['2027-01-19', 'Too late', -10]]),
      today,
      CHECK_IN_DAYS,
    );
    expect(window.rows.map((row) => row.transaction.name)).toEqual(['Last day']);
  });

  it('finds the first of two equal low points', () => {
    const window = scheduleWindow(
      result(1000, [['2026-11-20', 'Rent', -500], ['2026-11-22', 'Salary', 300], ['2026-11-25', 'Card', -300]]),
      today,
      CHECK_IN_DAYS,
    );
    expect(window.lowest.amount).toBe(500);
    expect(window.lowest.date.toString()).toBe('2026-11-20');
  });

  it('ignores a lower balance that falls after the window', () => {
    const window = scheduleWindow(
      result(1000, [['2026-11-20', 'Power', -100], ['2027-02-01', 'Tax', -800]]),
      today,
      CHECK_IN_DAYS,
    );
    expect(window.lowest).toEqual({ amount: 900, date: date('2026-11-20') });
  });

  it('uses the starting balance, dated today, when there are no rows', () => {
    const window = scheduleWindow(result(750, []), today, CHECK_IN_DAYS);
    expect(window.rows).toEqual([]);
    expect(window.lowest.amount).toBe(750);
    expect(window.lowest.date.toString()).toBe('2026-11-19');
  });

  it('says whether the runway ends inside the window', () => {
    expect(scheduleWindow(result(100, [], '2026-12-30'), today, CHECK_IN_DAYS).endsInWindow).toBe(true);
    expect(scheduleWindow(result(100, [], '2027-02-01'), today, CHECK_IN_DAYS).endsInWindow).toBe(false);
    expect(scheduleWindow(result(100, []), today, CHECK_IN_DAYS).endsInWindow).toBe(false);
  });
});
