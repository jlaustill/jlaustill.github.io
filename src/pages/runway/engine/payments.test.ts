import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { getNextDueDate, projectPayoff, type IDueDate } from './payments';
import type { IPayment } from '../types/IRunwayData';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-10-09');
const maxDate = today.add({ months: 120 });

const storeCard: IPayment = {
  name: 'Store card',
  amount: 300,
  day: 6,
  paymentPlan: { amount: 450, dueDates: ['2026-10-06', '2026-11-06', '2026-12-06'] },
};

const summarize = (due: IDueDate | null) =>
  due && { date: due.date.toString(), amount: due.amount, fromPlan: due.fromPlan };

describe('getNextDueDate', () => {
  it("uses the plan's next date and amount while the plan lasts", () => {
    expect(summarize(getNextDueDate(storeCard, today))).toEqual({ date: '2026-11-06', amount: 450, fromPlan: true });
  });

  it('resumes the regular amount on the regular day after the last plan date', () => {
    expect(summarize(getNextDueDate(storeCard, date('2026-12-07')))).toEqual({
      date: '2027-01-06',
      amount: 300,
      fromPlan: false,
    });
  });

  it('returns nothing after the plan when the regular amount is 0', () => {
    expect(getNextDueDate({ ...storeCard, amount: 0 }, date('2026-12-07'))).toBeNull();
  });

  it('reads plan dates in any order', () => {
    const shuffled = { ...storeCard, paymentPlan: { amount: 450, dueDates: ['2026-12-06', '2026-11-06'] } };
    expect(getNextDueDate(shuffled, today)?.date.toString()).toBe('2026-11-06');
  });

  it('skips a plan date that is not a real date', () => {
    const withBadDate = { ...storeCard, paymentPlan: { amount: 450, dueDates: ['not-a-date', '2026-11-06'] } };
    expect(getNextDueDate(withBadDate, today)?.date.toString()).toBe('2026-11-06');
  });

  it('is due on the regular day when there is no plan', () => {
    expect(summarize(getNextDueDate({ name: 'Phone', amount: 80, day: 17 }, today))).toEqual({
      date: '2026-10-17',
      amount: 80,
      fromPlan: false,
    });
  });

  it('counts a bill due today as due today', () => {
    expect(getNextDueDate({ name: 'Phone', amount: 80, day: 9 }, today)?.date.toString()).toBe('2026-10-09');
  });
});

describe('projectPayoff', () => {
  it('pays a plan off on its last draft', () => {
    const furniturePlan: IPayment = {
      name: 'Furniture plan',
      amount: 400,
      day: 16,
      type: 'collection',
      balance: 2400,
      paymentPlan: {
        amount: 400,
        dueDates: ['2026-10-16', '2026-10-30', '2026-11-13', '2026-11-27', '2026-12-11', '2026-12-25'],
      },
    };
    const projection = projectPayoff(furniturePlan, today, maxDate);
    expect(projection?.status === 'paidOff' && projection.date.toString()).toBe('2026-12-25');
  });

  it('amortizes an interest-bearing loan', () => {
    // 1,000 at 12% paid 100 a month takes 11 payments, the last one partial
    const loan: IPayment = { name: 'Loan', amount: 100, day: 9, type: 'personalLoan', balance: 1000, interestRate: 12 };
    const projection = projectPayoff(loan, today, maxDate);
    expect(projection?.status === 'paidOff' && projection.date.toString()).toBe('2027-08-09');
  });

  it('reports a payment that never covers the interest', () => {
    // 30% on 20,000 is about 500 a month, more than the 400 payment
    const card: IPayment = { name: 'Card', amount: 400, day: 6, type: 'creditCard', balance: 20000, interestRate: 30 };
    expect(projectPayoff(card, today, maxDate)).toEqual({ status: 'neverPaysOff' });
  });

  it('reports a debt that outlives the ten-year horizon', () => {
    const home: IPayment = {
      name: 'Home',
      amount: 1800,
      day: 1,
      type: 'mortgage',
      balance: 200000,
      interestRate: 6,
      escrow: 450,
    };
    expect(projectPayoff(home, today, maxDate)).toEqual({ status: 'beyondHorizon' });
  });

  it('names the values a debt still needs', () => {
    const card: IPayment = { name: 'Card', amount: 300, day: 5, type: 'creditCard', balance: 5000 };
    expect(projectPayoff(card, today, maxDate)).toEqual({ status: 'missingValues', fields: ['interestRate'] });
  });

  it('ignores anything that is not a debt', () => {
    expect(projectPayoff({ name: 'Power', amount: 120, day: 26, type: 'utility' }, today, maxDate)).toBeNull();
  });
});
