import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  getNextMonthlyDate,
  getNextWeeklyDate,
  sumCashOnHand,
  generateDepositSchedule,
  generateExpectedInflowTransactions,
  calculateRunwaySchedule,
} from './runwayEngine';
import type { IRunwayData } from '../types/IRunwayData';

describe('getNextMonthlyDate', () => {
  it('uses this month if the target day has not passed', () => {
    const after = Temporal.PlainDate.from('2026-09-08');
    expect(getNextMonthlyDate(13, after).toString()).toBe('2026-09-13');
  });

  it('rolls to next month if the target day has passed', () => {
    const after = Temporal.PlainDate.from('2026-09-20');
    expect(getNextMonthlyDate(13, after).toString()).toBe('2026-10-13');
  });

  it('clamps to the last day of a short month', () => {
    const after = Temporal.PlainDate.from('2026-01-01');
    expect(getNextMonthlyDate(31, after).toString()).toBe('2026-01-31');
    const afterFeb = Temporal.PlainDate.from('2026-02-01');
    expect(getNextMonthlyDate(31, afterFeb).toString()).toBe('2026-02-28');
  });
});

describe('getNextWeeklyDate', () => {
  it('finds the next occurrence of a weekday (1=Mon..7=Sun)', () => {
    const tuesday = Temporal.PlainDate.from('2026-09-08'); // a Tuesday
    expect(getNextWeeklyDate(5, tuesday).toString()).toBe('2026-09-11'); // next Friday
  });
});

describe('sumCashOnHand', () => {
  it('sums all account amounts', () => {
    expect(sumCashOnHand([{ name: 'A', amount: 10 }, { name: 'B', amount: 5.5 }])).toBe(15.5);
  });
});

describe('generateDepositSchedule', () => {
  it('generates monthly occurrences up to an endDate', () => {
    const start = Temporal.PlainDate.from('2026-09-01');
    const result = generateDepositSchedule(
      [{ name: 'Paycheck', amount: 1000, frequency: 'monthly', day: 25, endDate: '2026-11-25' }],
      start,
    );
    expect(result.map((t) => t.date.toString())).toEqual(['2026-09-25', '2026-10-25', '2026-11-25']);
  });

  it('generates weekly occurrences up to a count', () => {
    const start = Temporal.PlainDate.from('2026-09-08'); // Tuesday
    const result = generateDepositSchedule(
      [{ name: 'Gig income', amount: 100, frequency: 'weekly', day: 5, occurrences: 2 }],
      start,
    );
    expect(result.map((t) => t.date.toString())).toEqual(['2026-09-11', '2026-09-18']);
  });
});

describe('generateExpectedInflowTransactions', () => {
  it('includes only inflows with a non-null date', () => {
    const result = generateExpectedInflowTransactions([
      { name: 'Refund', amount: 300, date: null },
      { name: 'Tax refund', amount: 450, date: '2026-04-15' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Tax refund');
  });
});

describe('calculateRunwaySchedule', () => {
  const today = Temporal.PlainDate.from('2026-09-08');

  it('starts from the sum of cashOnHand', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 500 }],
      expectedInflows: [],
      payments: [],
      deposits: [],
    };
    expect(calculateRunwaySchedule(data, today).startingBalance).toBe(500);
  });

  it('excludes a delinquent payment with amount 0 and no reinstatement fields', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 1000 }],
      expectedInflows: [],
      payments: [{ name: 'Charged off card', amount: 0, day: 5 }],
      deposits: [],
    };
    const schedule = calculateRunwaySchedule(data, today);
    expect(schedule.scheduled).toHaveLength(0);
    expect(schedule.runwayEndDate).toBeNull();
  });

  it('applies a one-time reinstatement lump then reverts to the recurring amount', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 20000 }],
      expectedInflows: [],
      payments: [
        {
          name: 'Mortgage',
          amount: 0,
          shouldBe: 14670,
          day: 13,
          reinstatementDue: '2026-11-01',
          revertsToMonthlyPayment: 2894.76,
        },
      ],
      deposits: [],
    };
    const schedule = calculateRunwaySchedule(data, today, 4);
    const amounts = schedule.scheduled.map((t) => `${t.date.toString()}: ${t.amount}`);
    expect(amounts).toContain('2026-11-01: -14670');
    expect(amounts.some((a) => a.startsWith('2026-12-13: -2894.76'))).toBe(true);
  });

  it('stops the schedule when a payment cannot be afforded', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 100 }],
      expectedInflows: [],
      payments: [{ name: 'Rent', amount: 1200, day: 1 }],
      deposits: [],
    };
    const schedule = calculateRunwaySchedule(data, today);
    expect(schedule.stoppedAtName).toBe('Rent');
    expect(schedule.runwayEndDate).not.toBeNull();
  });
});
