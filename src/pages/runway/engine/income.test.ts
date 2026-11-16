import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { generateIncomeDeposits, generateInflowDeposits } from './income';
import type { IExpectedInflow, IRecurringIncome } from '../types/IRunwayData';
import type { IScheduledTransaction } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const datesOf = (deposits: IScheduledTransaction[]) => deposits.map((deposit) => deposit.date.toString());

const salary = (overrides: Partial<IRecurringIncome> = {}): IRecurringIncome => ({
  name: 'Salary',
  amount: 2500,
  schedule: 'semi-monthly',
  days: [1, 15],
  ...overrides,
});

describe('generateIncomeDeposits', () => {
  it('pays a semi-monthly salary on both days of every month', () => {
    const deposits = generateIncomeDeposits([salary()], date('2026-11-16'), date('2027-01-31'));
    expect(datesOf(deposits)).toEqual(['2026-12-01', '2026-12-15', '2027-01-01', '2027-01-15']);
    expect(deposits.every((deposit) => deposit.amount === 2500 && deposit.name === 'Salary')).toBe(true);
  });

  it('counts a payday that falls today, and one on the last day of the window', () => {
    const deposits = generateIncomeDeposits([salary()], date('2026-12-15'), date('2027-01-01'));
    expect(datesOf(deposits)).toEqual(['2026-12-15', '2027-01-01']);
  });

  it('clamps a monthly payday to short months', () => {
    const deposits = generateIncomeDeposits(
      [salary({ schedule: 'monthly', days: [31] })],
      date('2027-01-01'),
      date('2027-03-31'),
    );
    expect(datesOf(deposits)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
  });

  it('pays weekly on an ISO weekday', () => {
    // 2026-09-08 is a Tuesday; 5 is Friday
    const deposits = generateIncomeDeposits(
      [salary({ schedule: 'weekly', days: [5] })],
      date('2026-09-08'),
      date('2026-09-25'),
    );
    expect(datesOf(deposits)).toEqual(['2026-09-11', '2026-09-18', '2026-09-25']);
  });

  it('counts a weekly payday that falls today', () => {
    const deposits = generateIncomeDeposits(
      [salary({ schedule: 'weekly', days: [5] })],
      date('2026-09-11'),
      date('2026-09-11'),
    );
    expect(datesOf(deposits)).toEqual(['2026-09-11']);
  });

  it('waits for a start date in the future', () => {
    const deposits = generateIncomeDeposits(
      [salary({ schedule: 'monthly', days: [1], startDate: '2027-01-10' })],
      date('2026-11-16'),
      date('2027-03-31'),
    );
    expect(datesOf(deposits)).toEqual(['2027-02-01', '2027-03-01']);
  });

  it('ignores a start date that has already passed', () => {
    const deposits = generateIncomeDeposits(
      [salary({ schedule: 'monthly', days: [1], startDate: '2026-01-01' })],
      date('2026-11-16'),
      date('2027-01-01'),
    );
    expect(datesOf(deposits)).toEqual(['2026-12-01', '2027-01-01']);
  });

  it('stops after the end date, counting the end date itself', () => {
    const deposits = generateIncomeDeposits(
      [salary({ endDate: '2026-12-15' })],
      date('2026-11-16'),
      date('2027-06-30'),
    );
    expect(datesOf(deposits)).toEqual(['2026-12-01', '2026-12-15']);
  });

  it('stops open-ended income at the end of the window instead of running forever', () => {
    const deposits = generateIncomeDeposits([salary()], date('2026-11-16'), date('2027-02-16'));
    expect(deposits).toHaveLength(6);
  });

  it('merges several incomes in date order', () => {
    const deposits = generateIncomeDeposits(
      [salary({ name: 'Late', schedule: 'monthly', days: [20] }), salary({ name: 'Early', schedule: 'monthly', days: [5] })],
      date('2026-11-16'),
      date('2026-12-31'),
    );
    expect(deposits.map((deposit) => `${deposit.date.toString()} ${deposit.name}`)).toEqual([
      '2026-11-20 Late',
      '2026-12-05 Early',
      '2026-12-20 Late',
    ]);
  });

  it.each([
    ['no days', salary({ days: [] })],
    ['only out-of-range days', salary({ days: [0, 32, 1.5] })],
    ['a weekday that does not exist', salary({ schedule: 'weekly', days: [8] })],
    ['an amount of 0', salary({ amount: 0 })],
  ])('produces nothing for income with %s', (_label, income) => {
    expect(generateIncomeDeposits([income], date('2026-11-16'), date('2027-11-16'))).toEqual([]);
  });
});

describe('generateInflowDeposits', () => {
  const today = date('2026-11-16');
  const maxDate = today.add({ months: 120 });
  const bonus = (overrides: Partial<IExpectedInflow> = {}): IExpectedInflow => ({
    name: 'Bonus',
    amount: 900,
    date: null,
    expectedMonth: '2027-03',
    confirmed: true,
    ...overrides,
  });

  it('counts a confirmed inflow on the last day of its expected month', () => {
    const deposits = generateInflowDeposits([bonus()], today, maxDate);
    expect(deposits.map((deposit) => [deposit.date.toString(), deposit.name, deposit.amount])).toEqual([
      ['2027-03-31', 'Bonus', 900],
    ]);
  });

  it('prefers an exact date over the expected month', () => {
    expect(datesOf(generateInflowDeposits([bonus({ date: '2027-02-10' })], today, maxDate))).toEqual(['2027-02-10']);
  });

  it("counts this month's inflow on the month's last day", () => {
    expect(datesOf(generateInflowDeposits([bonus({ expectedMonth: '2026-11' })], today, maxDate))).toEqual([
      '2026-11-30',
    ]);
  });

  it('treats an empty date as no date', () => {
    expect(datesOf(generateInflowDeposits([bonus({ date: '' })], today, maxDate))).toEqual(['2027-03-31']);
  });

  it('returns inflows in date order', () => {
    const deposits = generateInflowDeposits(
      [bonus({ name: 'Later', expectedMonth: '2027-05' }), bonus({ name: 'Sooner', expectedMonth: '2027-01' })],
      today,
      maxDate,
    );
    expect(deposits.map((deposit) => deposit.name)).toEqual(['Sooner', 'Later']);
  });

  it.each([
    ['unconfirmed', bonus({ confirmed: false })],
    ['missing its confirmation', { name: 'Bonus', amount: 900, date: null, expectedMonth: '2027-03' }],
    ['without an amount', bonus({ amount: null })],
    ['of 0', bonus({ amount: 0 })],
    ['with only an approximate month', bonus({ expectedMonth: '~2031' })],
    ['dated before today', bonus({ date: '2026-11-01', expectedMonth: null })],
    ['expected in a month that has ended', bonus({ expectedMonth: '2026-10' })],
    ['dated on an impossible day', bonus({ date: '2027-02-30', expectedMonth: null })],
    ['expected beyond the horizon', bonus({ expectedMonth: '2040-01' })],
  ])('never counts an inflow %s', (_label, inflow) => {
    expect(generateInflowDeposits([inflow], today, maxDate)).toEqual([]);
  });
});
