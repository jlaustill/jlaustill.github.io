import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  describeUpdated,
  formatClockTime,
  formatLongDate,
  formatMoney,
  formatMoneyInput,
  formatShortDate,
  formatSignedMoney,
  formatWholeMoney,
  parseMoneyInput,
  paymentTypeLabel,
} from './format';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-11-19');

describe('money', () => {
  it('formats dollars and cents', () => {
    expect(formatMoney(1525)).toBe('$1,525.00');
    expect(formatMoney(-1800)).toBe('-$1,800.00');
  });

  it('formats whole dollars for the summary cards', () => {
    expect(formatWholeMoney(1525)).toBe('$1,525');
    expect(formatWholeMoney(1525.6)).toBe('$1,526');
  });

  it('signs money in and money out, and leaves zero unsigned', () => {
    expect(formatSignedMoney(2500)).toBe('+$2,500.00');
    expect(formatSignedMoney(-1800)).toBe('-$1,800.00');
    expect(formatSignedMoney(0)).toBe('$0.00');
  });

  it('reads a typed amount, ignoring the dollar sign, commas and spaces', () => {
    expect(parseMoneyInput('$1,200.50')).toBe(1200.5);
    expect(parseMoneyInput(' 300 ')).toBe(300);
    expect(parseMoneyInput('-25')).toBe(-25);
  });

  it('treats empty or non-numeric text as no amount', () => {
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
  });

  it('formats an amount for editing', () => {
    expect(formatMoneyInput(1200)).toBe('1,200.00');
    expect(formatMoneyInput(0)).toBe('0.00');
    expect(formatMoneyInput(-25.5)).toBe('-25.50');
  });
});

describe('dates', () => {
  it('shows a short date, adding the year only when it is not this year', () => {
    expect(formatShortDate(date('2026-12-01'), today)).toBe('Dec 1');
    expect(formatShortDate(date('2027-01-06'), today)).toBe('Jan 6, 2027');
  });

  it('shows a long date with the year', () => {
    expect(formatLongDate(date('2027-01-20'))).toBe('Jan 20, 2027');
  });

  it('shows clock time in 12-hour form', () => {
    expect(formatClockTime(new Date(2026, 10, 19, 7, 2))).toBe('7:02 AM');
    expect(formatClockTime(new Date(2026, 10, 19, 19, 5))).toBe('7:05 PM');
    expect(formatClockTime(new Date(2026, 10, 19, 0, 30))).toBe('12:30 AM');
    expect(formatClockTime(new Date(2026, 10, 19, 12, 0))).toBe('12:00 PM');
  });
});

describe('describeUpdated', () => {
  it.each([
    ['2026-11-19', 'Updated today', false],
    ['2026-11-18', 'Updated yesterday', false],
    ['2026-11-12', 'Updated 7 days ago', false],
    ['2026-11-11', 'Updated 8 days ago', true],
    ['2026-11-20', 'Updated today', false],
  ])('describes %s', (updatedAt, text, stale) => {
    expect(describeUpdated(updatedAt, today)).toEqual({ text, stale });
  });

  it.each([[undefined], [''], ['garbage'], [null]])('calls %j not dated, and stale', (updatedAt) => {
    expect(describeUpdated(updatedAt, today)).toEqual({ text: 'Not dated', stale: true });
  });
});

describe('paymentTypeLabel', () => {
  it('reads stored types as words', () => {
    expect(paymentTypeLabel('creditCard')).toBe('Credit card');
    expect(paymentTypeLabel('personalLoan')).toBe('Personal loan');
    expect(paymentTypeLabel('unsecured')).toBe('Unsecured loan');
    expect(paymentTypeLabel('secured')).toBe('Secured loan');
    expect(paymentTypeLabel('utility')).toBe('Utility');
  });

  it('shows a type it does not know as it is, and a missing type as No type', () => {
    expect(paymentTypeLabel('someOtherKind')).toBe('someOtherKind');
    expect(paymentTypeLabel(undefined)).toBe('No type');
    expect(paymentTypeLabel('')).toBe('No type');
  });
});
