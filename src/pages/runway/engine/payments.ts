import { Temporal } from '@js-temporal/polyfill';
import { getNextMonthlyDate, parseIsoDate } from './calendar';
import { applyPayment, createDebt, findMissingDebtFields, isDebtType } from './debt';
import type { IPayment } from '../types/IRunwayData';
import type { TPayoffProjection } from '../types/IRunwayResult';

export interface IDueDate {
  date: Temporal.PlainDate;
  amount: number;
  fromPlan: boolean;
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
    // A payment with no usable amount never reduces the balance
    if (!Number.isFinite(due.amount)) {
      return { status: 'neverPaysOff' };
    }
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
