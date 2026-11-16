import { Temporal } from '@js-temporal/polyfill';
import { roundToCents } from './money';

export type TDebtField = 'balance' | 'interestRate' | 'escrow';

// The values a payment needs before its balance can burn down, keyed by the payment's `type`.
// A type that is not listed here (a utility, a subscription, an insurance policy, or no type at
// all) is not a debt: it never ends, and it recurs for as long as the runway runs.
export const DEBT_FIELDS = {
  creditCard: ['balance', 'interestRate'],
  personalLoan: ['balance', 'interestRate'],
  unsecured: ['balance', 'interestRate'],
  secured: ['balance', 'interestRate'],
  // A mortgage payment carries escrow (property tax and homeowners insurance) on top of
  // principal and interest. Escrow is still due after the loan is paid off, so it has to be
  // separated out to burn the loan down correctly.
  mortgage: ['balance', 'interestRate', 'escrow'],
  // A collection account is a fixed sum owed; a collector's payment plan adds no interest, so
  // its rate is optional and defaults to 0.
  collection: ['balance'],
} as const satisfies Record<string, readonly TDebtField[]>;

export type TDebtType = keyof typeof DEBT_FIELDS;

export interface IDebtValues {
  type?: string;
  balance?: number; // what is owed now, not the last statement balance
  interestRate?: number; // annual percentage as printed: 24.99 means 24.99%
  escrow?: number; // mortgage only: the part of each payment that is not principal or interest
}

export interface IDebt {
  balance: number;
  interestRate: number;
  escrow: number;
  accruedThrough: Temporal.PlainDate;
}

export interface IPaymentResult {
  paid: number; // what actually leaves the bank, which can be less than the scheduled amount
  debt: IDebt;
  paidOff: boolean;
}

export function isDebtType(type: string | undefined): type is TDebtType {
  return type !== undefined && Object.prototype.hasOwnProperty.call(DEBT_FIELDS, type);
}

export function findMissingDebtFields(values: IDebtValues): TDebtField[] {
  if (!isDebtType(values.type)) {
    return [];
  }
  const fields: readonly TDebtField[] = DEBT_FIELDS[values.type];
  return fields.filter((field) => typeof values[field] !== 'number');
}

// Returns null when the payment is not a debt, or is a debt still missing a value its type
// needs. Either way it cannot burn down, so it recurs forever, which is the conservative
// answer for a runway.
export function createDebt(values: IDebtValues, asOf: Temporal.PlainDate): IDebt | null {
  if (!isDebtType(values.type) || findMissingDebtFields(values).length > 0) {
    return null;
  }
  return {
    balance: values.balance ?? 0,
    interestRate: values.interestRate ?? 0,
    escrow: values.escrow ?? 0,
    accruedThrough: asOf,
  };
}

// Interest accrues daily at rate / 365 from the last payment (or from the day the balance was
// read) up to this one, which is how card issuers and most lenders compute it. Accruing by days
// rather than once per payment keeps a plan that pays every two weeks from being charged a
// month of interest twice.
export function applyPayment(debt: IDebt, scheduledAmount: number, date: Temporal.PlainDate): IPaymentResult {
  const days = debt.accruedThrough.until(date).days;
  const interest = debt.balance * (debt.interestRate / 100) * (days / 365);
  const owed = roundToCents(debt.balance + interest);
  const towardBalance = Math.min(Math.max(scheduledAmount - debt.escrow, 0), owed);
  const balance = roundToCents(owed - towardBalance);

  return {
    paid: roundToCents(debt.escrow + towardBalance),
    debt: { ...debt, balance, accruedThrough: date },
    paidOff: balance <= 0,
  };
}
