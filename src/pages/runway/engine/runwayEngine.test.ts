import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { calculateRunway } from './runwayEngine';
import type { IPayment, IRunwayData } from '../types/IRunwayData';
import type { IScheduledTransaction } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-11-16');

const runwayData = (overrides: Partial<IRunwayData>): IRunwayData => ({
  cashOnHand: [],
  payments: [],
  recurringIncome: [],
  expectedInflows: [],
  ...overrides,
});
const rows = (scheduled: IScheduledTransaction[]) =>
  scheduled.map((row) => [row.date.toString(), row.name, row.amount]);

describe('calculateRunway', () => {
  it('starts from the sum of cash on hand', () => {
    const result = calculateRunway(
      runwayData({ cashOnHand: [{ name: 'Checking', amount: 500 }, { name: 'Wallet', amount: 250.5 }] }),
      today,
    );
    expect(result.startingBalance).toBe(750.5);
    expect(result.scheduled).toEqual([]);
    expect(result.runwayEndDate).toBeNull();
    expect(result.lowestBalance.amount).toBe(750.5);
    expect(result.lowestBalance.date.toString()).toBe('2026-11-16');
  });

  it("applies income that lands on the same day before that day's bill", () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 0 }],
        recurringIncome: [{ name: 'Salary', amount: 1000, schedule: 'monthly', days: [1] }],
        payments: [{ name: 'Rent', amount: 900, day: 1 }],
      }),
      today,
      3,
    );
    expect(rows(result.scheduled).slice(0, 2)).toEqual([
      ['2026-12-01', 'Salary', 1000],
      ['2026-12-01', 'Rent', -900],
    ]);
    expect(result.stoppedAtName).toBeNull();
  });

  it('ends the runway the day before the first payment it cannot cover', () => {
    const result = calculateRunway(
      runwayData({ cashOnHand: [{ name: 'Checking', amount: 100 }], payments: [{ name: 'Rent', amount: 1200, day: 1 }] }),
      today,
    );
    expect(result.stoppedAtName).toBe('Rent');
    expect(result.runwayEndDate?.toString()).toBe('2026-11-30');
  });

  it('has no runway end when income covers every bill for ten years', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 0 }],
        recurringIncome: [{ name: 'Salary', amount: 2000, schedule: 'semi-monthly', days: [1, 15] }],
        payments: [{ name: 'Rent', amount: 1500, day: 2 }],
      }),
      today,
    );
    expect(result.runwayEndDate).toBeNull();
    expect(result.stoppedAtName).toBeNull();
  });

  it('stops charging a debt once it is paid off and flags the final payment', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 1000 }],
        payments: [{ name: 'Plan', amount: 100, day: 20, type: 'collection', balance: 300 }],
      }),
      today,
    );
    expect(result.scheduled.map((row) => [row.date.toString(), row.amount, row.paidOff ?? false])).toEqual([
      ['2026-11-20', -100, false],
      ['2026-12-20', -100, false],
      ['2027-01-20', -100, true],
    ]);
    expect(result.runwayEndDate).toBeNull();
  });

  it('counts a confirmed inflow on the last day of its expected month', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 800 }],
        expectedInflows: [{ name: 'Bonus', amount: 900, date: null, expectedMonth: '2026-12', confirmed: true }],
        payments: [{ name: 'Bill', amount: 800, day: 31 }],
      }),
      today,
    );
    expect(rows(result.scheduled)).toContainEqual(['2026-12-31', 'Bonus', 900]);
    expect(result.stoppedAtName).toBe('Bill');
    expect(result.runwayEndDate?.toString()).toBe('2027-01-30');
  });

  it('does not count an unconfirmed inflow', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 800 }],
        expectedInflows: [{ name: 'Bonus', amount: 900, date: null, expectedMonth: '2026-12', confirmed: false }],
        payments: [{ name: 'Bill', amount: 800, day: 31 }],
      }),
      today,
    );
    expect(result.runwayEndDate?.toString()).toBe('2026-12-30');
  });

  it('reports the lowest projected balance and when it happens', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 1000 }],
        recurringIncome: [{ name: 'Salary', amount: 600, schedule: 'monthly', days: [20] }],
        payments: [{ name: 'Rent', amount: 900, day: 18 }],
      }),
      today,
    );
    expect(result.lowestBalance.amount).toBe(100);
    expect(result.lowestBalance.date.toString()).toBe('2026-11-18');
  });

  it('lists a payoff projection for each debt, in file order', () => {
    const result = calculateRunway(
      runwayData({
        payments: [
          { name: 'Power', amount: 120, day: 3, type: 'utility' },
          { name: 'Card', amount: 300, day: 9, type: 'creditCard', balance: 5000 },
          { name: 'Plan', amount: 100, day: 20, type: 'collection', balance: 300 },
        ],
      }),
      today,
    );
    expect(result.payoffs.map((payoff) => payoff.name)).toEqual(['Card', 'Plan']);
    expect(result.payoffs[0].projection).toEqual({ status: 'missingValues', fields: ['interestRate'] });
    const plan = result.payoffs[1].projection;
    expect(plan.status === 'paidOff' && plan.date.toString()).toBe('2027-01-20');
  });

  it('skips a payment of 0 with no plan', () => {
    const result = calculateRunway(
      runwayData({ cashOnHand: [{ name: 'Checking', amount: 100 }], payments: [{ name: 'Cancelled', amount: 0, day: 5 }] }),
      today,
    );
    expect(result.scheduled).toEqual([]);
    expect(result.runwayEndDate).toBeNull();
  });

  it('ends the runway at a payment whose amount is missing, instead of skipping it', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 1000 }],
        payments: [{ name: 'Mystery', day: 20 } as unknown as IPayment],
      }),
      today,
    );
    expect(result.stoppedAtName).toBe('Mystery');
    expect(result.runwayEndDate?.toString()).toBe('2026-11-19');
    expect(result.lowestBalance.amount).toBe(1000);
  });

  it('ends the runway at a plan payment whose amount is missing', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 1000 }],
        payments: [{ name: 'Plan', amount: 0, day: 12, paymentPlan: { dueDates: ['2026-12-12'] } } as unknown as IPayment],
      }),
      today,
    );
    expect(result.stoppedAtName).toBe('Plan');
    expect(result.runwayEndDate?.toString()).toBe('2026-12-11');
  });

  it('reads a payment day of 0 as the 1st instead of failing', () => {
    const result = calculateRunway(
      runwayData({ cashOnHand: [{ name: 'Checking', amount: 1000 }], payments: [{ name: 'Rent', amount: 100, day: 0 }] }),
      today,
      2,
    );
    expect(rows(result.scheduled)[0]).toEqual(['2026-12-01', 'Rent', -100]);
  });

  it('keeps open-ended income inside the horizon', () => {
    const result = calculateRunway(
      runwayData({
        cashOnHand: [{ name: 'Checking', amount: 0 }],
        recurringIncome: [{ name: 'Salary', amount: 1000, schedule: 'semi-monthly', days: [1, 15] }],
        payments: [{ name: 'Rent', amount: 500, day: 3 }],
      }),
      today,
      3,
    );
    expect(result.scheduled.length).toBeGreaterThan(0);
    expect(result.scheduled.every((row) => Temporal.PlainDate.compare(row.date, date('2027-02-16')) <= 0)).toBe(true);
  });
});
