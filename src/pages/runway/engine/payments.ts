import { Temporal } from '@js-temporal/polyfill';
import { applyPayment, createDebt, findMissingDebtFields, isDebtType } from './debt';
import type { IPayment } from '../types/IRunwayData';
import type { TPayoffProjection } from '../types/IRunwayResult';

export interface IDueDate {
  date: Temporal.PlainDate;
  amount: number;
  fromPlan: boolean;
}

// Only a real YYYY-MM-DD date counts. Anything else in the file (an empty string, an
// impossible day, free text) means "no date", never a crash.
export function parseIsoDate(value: unknown): Temporal.PlainDate | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  try {
    return Temporal.PlainDate.from(value, { overflow: 'reject' });
  } catch {
    return null;
  }
}

// The first occurrence of `day` on or after `onOrAfter`, clamped to the length of short months.
function getNextMonthlyDate(day: number, onOrAfter: Temporal.PlainDate): Temporal.PlainDate {
  const inMonth = (month: Temporal.PlainDate) => month.with({ day: Math.min(day, month.daysInMonth) });
  const thisMonth = inMonth(onOrAfter);
  if (Temporal.PlainDate.compare(thisMonth, onOrAfter) >= 0) {
    return thisMonth;
  }
  return inMonth(onOrAfter.with({ day: 1 }).add({ months: 1 }));
}

function planDates(payment: IPayment): Temporal.PlainDate[] {
  const dueDates = payment.paymentPlan?.dueDates;
  if (!Array.isArray(dueDates)) {
    return [];
  }
  return dueDates
    .map((dueDate) => parseIsoDate(dueDate))
    .filter((dueDate): dueDate is Temporal.PlainDate => dueDate !== null)
    .sort(Temporal.PlainDate.compare);
}

// A payment plan replaces the regular payment on its own dates. Once the plan's last date has
// passed, the regular amount resumes on the regular day, and a regular amount of 0 means
// nothing is due after the plan. A payment due on `onOrAfter` itself is due that day.
export function getNextDueDate(payment: IPayment, onOrAfter: Temporal.PlainDate): IDueDate | null {
  const plan = payment.paymentPlan;
  if (plan) {
    const nextPlanDate = planDates(payment).find(
      (dueDate) => Temporal.PlainDate.compare(dueDate, onOrAfter) >= 0,
    );
    if (nextPlanDate) {
      return { date: nextPlanDate, amount: plan.amount, fromPlan: true };
    }
  }

  if (payment.amount === 0) {
    return null;
  }
  return { date: getNextMonthlyDate(payment.day, onOrAfter), amount: payment.amount, fromPlan: false };
}

// When a debt is paid off if every payment is made on time, independent of whether the cash on
// hand lasts that long. Returns null for anything that is not a debt.
export function projectPayoff(
  payment: IPayment,
  today: Temporal.PlainDate,
  maxDate: Temporal.PlainDate,
): TPayoffProjection | null {
  if (!isDebtType(payment.type)) {
    return null;
  }
  const missing = findMissingDebtFields(payment);
  if (missing.length > 0) {
    return { status: 'missingValues', fields: missing };
  }

  let debt = createDebt(payment, today);
  if (!debt) {
    return null;
  }
  if (debt.balance <= 0) {
    return { status: 'paidOff', date: today };
  }

  let due = getNextDueDate(payment, today);
  while (due && Temporal.PlainDate.compare(due.date, maxDate) <= 0) {
    const result = applyPayment(debt, due.amount, due.date);
    if (result.paidOff) {
      return { status: 'paidOff', date: due.date };
    }
    // A plan payment may legitimately be smaller than the interest for a while; a regular
    // payment that cannot shrink the balance never will.
    if (!due.fromPlan && result.debt.balance >= debt.balance) {
      return { status: 'neverPaysOff' };
    }
    debt = result.debt;
    due = getNextDueDate(payment, due.date.add({ days: 1 }));
  }

  return due ? { status: 'beyondHorizon' } : { status: 'neverPaysOff' };
}
