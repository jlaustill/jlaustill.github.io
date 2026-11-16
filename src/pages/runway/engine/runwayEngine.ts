import { Temporal } from '@js-temporal/polyfill';
import { byDate } from './calendar';
import { applyPayment, createDebt, type IDebt } from './debt';
import { generateIncomeDeposits, generateInflowDeposits } from './income';
import { roundToCents } from './money';
import { getNextDueDate, projectPayoff, type IDueDate } from './payments';
import type { IPayment, IRunwayData } from '../types/IRunwayData';
import type { IDebtPayoff, IRunwayResult, IScheduledTransaction } from '../types/IRunwayResult';

// Ten years: far enough out to see every realistic runway, and a hard stop for a balance that
// the payment never actually reduces.
export const HORIZON_MONTHS = 120;

interface IUpcomingPayment extends IDueDate {
  payment: IPayment;
  debt: IDebt | null; // null when the payment never burns down
}

function upcomingPayments(payments: IPayment[], today: Temporal.PlainDate): IUpcomingPayment[] {
  const upcoming: IUpcomingPayment[] = [];
  for (const payment of payments) {
    const debt = createDebt(payment, today);
    if (debt && debt.balance <= 0 && debt.escrow === 0) {
      continue; // already paid off, nothing left to schedule
    }
    const next = getNextDueDate(payment, today);
    if (next) {
      upcoming.push({ ...next, payment, debt });
    }
  }
  return upcoming;
}

function debtPayoffs(payments: IPayment[], today: Temporal.PlainDate, maxDate: Temporal.PlainDate): IDebtPayoff[] {
  return payments.flatMap((payment) => {
    const projection = projectPayoff(payment, today, maxDate);
    return projection ? [{ name: payment.name, projection }] : [];
  });
}

// Walks every payment and deposit in date order from today. Deposits dated on or before a
// payment land first; the first payment the balance cannot cover ends the runway on the day
// before it.
export function calculateRunway(
  data: IRunwayData,
  today: Temporal.PlainDate,
  horizonMonths = HORIZON_MONTHS,
): IRunwayResult {
  const maxDate = today.add({ months: horizonMonths });
  const startingBalance = roundToCents(
    data.cashOnHand.reduce((total, entry) => total + (typeof entry.amount === 'number' ? entry.amount : 0), 0),
  );
  const deposits = [
    ...generateIncomeDeposits(data.recurringIncome, today, maxDate),
    ...generateInflowDeposits(data.expectedInflows, today, maxDate),
  ].sort(byDate);
  const upcoming = upcomingPayments(data.payments, today);

  const scheduled: IScheduledTransaction[] = [];
  let balance = startingBalance;
  let lowestBalance = { amount: startingBalance, date: today };
  const record = (transaction: IScheduledTransaction) => {
    balance = roundToCents(balance + transaction.amount);
    scheduled.push(transaction);
    if (balance < lowestBalance.amount) {
      lowestBalance = { amount: balance, date: transaction.date };
    }
  };

  let depositIndex = 0;
  let stoppedAtName: string | null = null;
  let stoppedAtDate: Temporal.PlainDate | null = null;

  // Every payment can end, so the loop also stops when nothing is left to pay
  while (upcoming.length > 0) {
    upcoming.sort(byDate);
    const next = upcoming[0];
    if (Temporal.PlainDate.compare(next.date, maxDate) > 0) {
      break; // the runway extends beyond the horizon
    }

    while (depositIndex < deposits.length && Temporal.PlainDate.compare(deposits[depositIndex].date, next.date) <= 0) {
      record(deposits[depositIndex]);
      depositIndex++;
    }

    // A debt's final payment is only what is left on it, which can be less than the scheduled amount
    const result = next.debt ? applyPayment(next.debt, next.amount, next.date) : null;
    const amountDue = result ? result.paid : next.amount;
    // A payment with no usable amount cannot be planned around, so the runway ends there
    // instead of the bill silently dropping out
    if (!Number.isFinite(amountDue) || amountDue > balance) {
      stoppedAtName = next.payment.name;
      stoppedAtDate = next.date;
      break;
    }

    const clearedBalance = result !== null && result.paidOff && next.debt !== null && next.debt.balance > 0;
    record({ date: next.date, name: next.payment.name, amount: -amountDue, ...(clearedBalance && { paidOff: true }) });

    // A paid-off debt drops out, except a mortgage, whose escrow carries on
    if (result) {
      next.debt = result.debt;
      if (result.paidOff && result.debt.escrow === 0) {
        upcoming.shift();
        continue;
      }
    }

    const following = getNextDueDate(next.payment, next.date.add({ days: 1 }));
    if (!following) {
      upcoming.shift();
      continue;
    }
    Object.assign(next, following);
  }

  return {
    startingBalance,
    scheduled,
    runwayEndDate: stoppedAtDate ? stoppedAtDate.subtract({ days: 1 }) : null,
    stoppedAtName,
    lowestBalance,
    payoffs: debtPayoffs(data.payments, today, maxDate),
  };
}
