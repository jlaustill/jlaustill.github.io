import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { applyPayment, createDebt, findMissingDebtFields, type IDebt } from './debt';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);

describe('findMissingDebtFields', () => {
  it('asks a credit card for its interest rate', () => {
    expect(findMissingDebtFields({ type: 'creditCard', balance: 5000 })).toEqual(['interestRate']);
  });

  it('asks a mortgage for escrow as well', () => {
    expect(findMissingDebtFields({ type: 'mortgage', balance: 200000, interestRate: 6 })).toEqual(['escrow']);
  });

  it('lists every missing field in the order the type declares them', () => {
    expect(findMissingDebtFields({ type: 'personalLoan' })).toEqual(['balance', 'interestRate']);
  });

  it('does not ask a collection for an interest rate', () => {
    expect(findMissingDebtFields({ type: 'collection', balance: 2400 })).toEqual([]);
  });

  it('asks nothing of a type that is not a debt', () => {
    expect(findMissingDebtFields({ type: 'utility' })).toEqual([]);
    expect(findMissingDebtFields({})).toEqual([]);
  });

  it('does not treat Object.prototype keys as debt types', () => {
    expect(findMissingDebtFields({ type: 'toString' })).toEqual([]);
  });
});

describe('createDebt', () => {
  it('returns null while a value is missing', () => {
    expect(createDebt({ type: 'creditCard', balance: 500 }, date('2026-10-09'))).toBeNull();
  });

  it('returns null for a type that is not a debt', () => {
    expect(createDebt({ type: 'subscription', balance: 500, interestRate: 10 }, date('2026-10-09'))).toBeNull();
  });

  it("defaults a collection's interest rate and escrow to 0", () => {
    const debt = createDebt({ type: 'collection', balance: 2400 }, date('2026-10-09'));
    expect({ balance: debt?.balance, interestRate: debt?.interestRate, escrow: debt?.escrow }).toEqual({
      balance: 2400,
      interestRate: 0,
      escrow: 0,
    });
  });
});

describe('applyPayment', () => {
  const debt = (overrides: Partial<IDebt>): IDebt => ({
    balance: 1000,
    interestRate: 0,
    escrow: 0,
    accruedThrough: date('2026-01-01'),
    ...overrides,
  });

  it('accrues interest daily since the last payment before applying the payment', () => {
    // 36.5% over 10 days is 1% of the balance
    const result = applyPayment(debt({ interestRate: 36.5 }), 100, date('2026-01-11'));
    expect(result.paid).toBe(100);
    expect(result.debt.balance).toBe(910);
    expect(result.paidOff).toBe(false);
  });

  it('charges two-week payments two weeks of interest, not a month each', () => {
    const first = applyPayment(debt({ interestRate: 36.5 }), 0, date('2026-01-15'));
    const second = applyPayment(first.debt, 0, date('2026-01-29'));
    // 14 days at 0.1% a day is 1.4%, compounded once at the first payment
    expect(first.debt.balance).toBe(1014);
    expect(second.debt.balance).toBe(1028.2);
  });

  it('pays only what is left on the final payment', () => {
    const result = applyPayment(debt({ balance: 50 }), 100, date('2026-01-15'));
    expect(result.paid).toBe(50);
    expect(result.debt.balance).toBe(0);
    expect(result.paidOff).toBe(true);
  });

  it("keeps collecting a mortgage's escrow after the loan is paid off", () => {
    const final = applyPayment(debt({ escrow: 400 }), 1500, date('2026-02-01'));
    expect(final.paid).toBe(1400);
    expect(final.paidOff).toBe(true);

    const escrowOnly = applyPayment(final.debt, 1500, date('2026-03-01'));
    expect(escrowOnly.paid).toBe(400);
  });

  it('lets a balance grow when the payment does not cover the interest', () => {
    // 365% for 10 days is 10% of the balance, more than the payment
    const result = applyPayment(debt({ interestRate: 365 }), 50, date('2026-01-11'));
    expect(result.debt.balance).toBe(1050);
    expect(result.paidOff).toBe(false);
  });
});
