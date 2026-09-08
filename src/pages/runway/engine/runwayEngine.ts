import { Temporal } from '@js-temporal/polyfill';
import type { ICashOnHandEntry, IDeposit, IExpectedInflow, IPayment, IRunwayData } from '../types/IRunwayData';

export interface IScheduledTransaction {
  date: Temporal.PlainDate;
  name: string;
  amount: number; // positive = money in, negative = money out
}

export interface IRunwaySchedule {
  scheduled: IScheduledTransaction[];
  startingBalance: number;
  runwayEndDate: Temporal.PlainDate | null; // null = runway extends beyond the projection window
  stoppedAtName: string | null;
}

const WEEKDAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function clampDayToMonth(year: number, month: number, targetDay: number): number {
  const monthStart = Temporal.PlainDate.from({ year, month, day: 1 });
  return Math.min(targetDay, monthStart.daysInMonth);
}

export function getNextMonthlyDate(day: number, after: Temporal.PlainDate): Temporal.PlainDate {
  if (after.day <= day) {
    return Temporal.PlainDate.from({
      year: after.year,
      month: after.month,
      day: clampDayToMonth(after.year, after.month, day),
    });
  }
  const nextMonth = after.add({ months: 1 });
  return Temporal.PlainDate.from({
    year: nextMonth.year,
    month: nextMonth.month,
    day: clampDayToMonth(nextMonth.year, nextMonth.month, day),
  });
}

export function getNextWeeklyDate(dayOfWeek: number, after: Temporal.PlainDate): Temporal.PlainDate {
  const currentDay = WEEKDAY_MAP[after.toLocaleString('en-US', { weekday: 'short' })];
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return after.add({ days: daysUntil });
}

export function sumCashOnHand(cashOnHand: ICashOnHandEntry[]): number {
  return cashOnHand.reduce((total, entry) => total + entry.amount, 0);
}

export function generateDepositSchedule(
  deposits: IDeposit[],
  startDate: Temporal.PlainDate,
): IScheduledTransaction[] {
  const scheduled: IScheduledTransaction[] = [];

  for (const deposit of deposits) {
    const endDate = deposit.endDate ? Temporal.PlainDate.from(deposit.endDate) : null;
    let nextDate =
      deposit.frequency === 'weekly'
        ? getNextWeeklyDate(deposit.day, startDate)
        : getNextMonthlyDate(deposit.day, startDate);
    let count = 0;

    while (true) {
      if (endDate && Temporal.PlainDate.compare(nextDate, endDate) > 0) break;
      if (deposit.occurrences !== undefined && count >= deposit.occurrences) break;

      scheduled.push({ date: nextDate, name: deposit.name, amount: deposit.amount });
      count++;

      nextDate =
        deposit.frequency === 'weekly'
          ? nextDate.add({ days: 7 })
          : getNextMonthlyDate(deposit.day, nextDate.add({ days: 1 }));
    }
  }

  return scheduled;
}

export function generateExpectedInflowTransactions(inflows: IExpectedInflow[]): IScheduledTransaction[] {
  return inflows
    .filter((inflow): inflow is IExpectedInflow & { date: string } => inflow.date !== null)
    .map((inflow) => ({
      date: Temporal.PlainDate.from(inflow.date),
      name: inflow.name,
      amount: inflow.amount,
    }));
}

interface IPaymentCursor {
  payment: IPayment;
  nextDate: Temporal.PlainDate;
}

function amountDueOn(payment: IPayment, date: Temporal.PlainDate): number {
  if (payment.reinstatementDue && payment.revertsToMonthlyPayment !== undefined) {
    const reinstatementDate = Temporal.PlainDate.from(payment.reinstatementDue);
    const comparison = Temporal.PlainDate.compare(date, reinstatementDate);
    if (comparison === 0) return payment.shouldBe ?? payment.amount;
    if (comparison > 0) return payment.revertsToMonthlyPayment;
  }
  return payment.amount;
}

function firstDateForPayment(payment: IPayment, today: Temporal.PlainDate): Temporal.PlainDate {
  if (payment.reinstatementDue && payment.amount === 0) {
    return Temporal.PlainDate.from(payment.reinstatementDue);
  }
  return getNextMonthlyDate(payment.day, today);
}

// After the reinstatement lump is paid, the resumed recurring payment must fall in a later
// calendar month than the reinstatement date, never the same month. A plain day+1 advance can
// land in the same month when the reinstatement date's day-of-month is earlier than the
// payment's regular due day (e.g. reinstatement on the 1st, due day 13 -> naive advance gives
// the 13th of that SAME month, only ~12 days after the lump). Real reinstatement terms resume
// the regular payment schedule starting the month after the catch-up, so when the naive advance
// would double-bill within the reinstatement month, push to next month's occurrence instead.
function nextDateForPayment(payment: IPayment, processedDate: Temporal.PlainDate): Temporal.PlainDate {
  const candidate = getNextMonthlyDate(payment.day, processedDate.add({ days: 1 }));

  if (payment.reinstatementDue) {
    const reinstatementDate = Temporal.PlainDate.from(payment.reinstatementDue);
    const wasReinstatementPayment = Temporal.PlainDate.compare(processedDate, reinstatementDate) === 0;
    const candidateIsSameMonth = candidate.year === processedDate.year && candidate.month === processedDate.month;

    if (wasReinstatementPayment && candidateIsSameMonth) {
      return getNextMonthlyDate(payment.day, processedDate.add({ months: 1 }));
    }
  }

  return candidate;
}

export function calculateRunwaySchedule(
  runwayData: IRunwayData,
  today: Temporal.PlainDate,
  maxMonths = 120,
): IRunwaySchedule {
  const startingBalance = sumCashOnHand(runwayData.cashOnHand);
  let balance = startingBalance;

  const deposits = [
    ...generateDepositSchedule(runwayData.deposits, today),
    ...generateExpectedInflowTransactions(runwayData.expectedInflows),
  ].sort((a, b) => Temporal.PlainDate.compare(a.date, b.date));

  const cursors: IPaymentCursor[] = runwayData.payments
    .filter((payment) => payment.amount > 0 || (payment.reinstatementDue && payment.revertsToMonthlyPayment !== undefined))
    .map((payment) => ({ payment, nextDate: firstDateForPayment(payment, today) }));

  const scheduled: IScheduledTransaction[] = [];
  const maxDate = today.add({ months: maxMonths });
  let depositIndex = 0;
  let stoppedAtName: string | null = null;
  let stoppedAtDate: Temporal.PlainDate | null = null;

  while (cursors.length > 0) {
    cursors.sort((a, b) => Temporal.PlainDate.compare(a.nextDate, b.nextDate));
    const next = cursors[0];

    if (Temporal.PlainDate.compare(next.nextDate, maxDate) > 0) break;

    while (
      depositIndex < deposits.length &&
      Temporal.PlainDate.compare(deposits[depositIndex].date, next.nextDate) <= 0
    ) {
      balance += deposits[depositIndex].amount;
      scheduled.push(deposits[depositIndex]);
      depositIndex++;
    }

    const due = amountDueOn(next.payment, next.nextDate);
    if (due > balance) {
      stoppedAtName = next.payment.name;
      stoppedAtDate = next.nextDate;
      break;
    }

    balance -= due;
    scheduled.push({ date: next.nextDate, name: next.payment.name, amount: -due });
    next.nextDate = nextDateForPayment(next.payment, next.nextDate);
  }

  return {
    scheduled,
    startingBalance,
    runwayEndDate: stoppedAtDate ? stoppedAtDate.subtract({ days: 1 }) : null,
    stoppedAtName,
  };
}
