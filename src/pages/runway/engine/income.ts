import { Temporal } from '@js-temporal/polyfill';
import { byDate, getNextMonthlyDate, getNextWeeklyDate, lastDayOfMonth, parseIsoDate } from './calendar';
import type { IExpectedInflow, IRecurringIncome } from '../types/IRunwayData';
import type { IScheduledTransaction } from '../types/IRunwayResult';

const KNOWN_SCHEDULES = new Set(['semi-monthly', 'monthly', 'weekly']);

const isAbsent = (value: unknown) => value === undefined || value === null || value === '';

const laterOf = (a: Temporal.PlainDate, b: Temporal.PlainDate) => (Temporal.PlainDate.compare(a, b) >= 0 ? a : b);
const earlierOf = (a: Temporal.PlainDate, b: Temporal.PlainDate) => (Temporal.PlainDate.compare(a, b) <= 0 ? a : b);

// Days of the month (1 to 31), or ISO weekdays (1 to 7) for weekly income. Anything else in the
// file is ignored rather than guessed at.
function validDays(income: IRecurringIncome): number[] {
  if (!Array.isArray(income.days)) {
    return [];
  }
  const highest = income.schedule === 'weekly' ? 7 : 31;
  return income.days.filter((day) => Number.isInteger(day) && day >= 1 && day <= highest);
}

function nextPayday(income: IRecurringIncome, days: number[], onOrAfter: Temporal.PlainDate): Temporal.PlainDate {
  return days
    .map((day) =>
      income.schedule === 'weekly' ? getNextWeeklyDate(day, onOrAfter) : getNextMonthlyDate(day, onOrAfter),
    )
    .reduce(earlierOf);
}

// Every payday from the later of today and the income's start date, through the earlier of its
// end date and maxDate. Paydays are not moved off weekends: modeling the later date is the
// conservative side.
export function generateIncomeDeposits(
  income: IRecurringIncome[],
  today: Temporal.PlainDate,
  maxDate: Temporal.PlainDate,
): IScheduledTransaction[] {
  const deposits: IScheduledTransaction[] = [];

  for (const source of income) {
    // A schedule the engine does not know (quarterly, yearly, missing) is not guessed at
    if (!KNOWN_SCHEDULES.has(source.schedule)) {
      continue;
    }
    const days = validDays(source);
    if (days.length === 0 || typeof source.amount !== 'number' || source.amount <= 0) {
      continue;
    }
    const startDate = parseIsoDate(source.startDate);
    const endDate = parseIsoDate(source.endDate);
    // A start or end date that is present but unreadable could mean anything, so the income
    // counts for nothing rather than for ten years
    if ((!isAbsent(source.startDate) && !startDate) || (!isAbsent(source.endDate) && !endDate)) {
      continue;
    }
    const lastDate = endDate ? earlierOf(endDate, maxDate) : maxDate;

    let payday = nextPayday(source, days, startDate ? laterOf(startDate, today) : today);
    while (Temporal.PlainDate.compare(payday, lastDate) <= 0) {
      deposits.push({ date: payday, name: source.name, amount: source.amount });
      payday = nextPayday(source, days, payday.add({ days: 1 }));
    }
  }

  return deposits.sort(byDate);
}

// A one-time inflow counts only when it is certain: confirmed, with a positive amount, and a
// date that is still ahead. Its date is `date` when that is a real date, otherwise the last day
// of `expectedMonth` when that is an exact month.
export function generateInflowDeposits(
  inflows: IExpectedInflow[],
  today: Temporal.PlainDate,
  maxDate: Temporal.PlainDate,
): IScheduledTransaction[] {
  const deposits: IScheduledTransaction[] = [];

  for (const inflow of inflows) {
    if (inflow.confirmed !== true || typeof inflow.amount !== 'number' || inflow.amount <= 0) {
      continue;
    }
    const date = parseIsoDate(inflow.date) ?? lastDayOfMonth(inflow.expectedMonth);
    if (!date || Temporal.PlainDate.compare(date, today) < 0 || Temporal.PlainDate.compare(date, maxDate) > 0) {
      continue;
    }
    deposits.push({ date, name: inflow.name, amount: inflow.amount });
  }

  return deposits.sort(byDate);
}
