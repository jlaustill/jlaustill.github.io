import { Temporal } from '@js-temporal/polyfill';
import { roundToCents } from './money';
import type { IRunwayResult, IScheduledTransaction } from '../types/IRunwayResult';

// The check-in shows the next two months: what gets acted on this visit.
export const CHECK_IN_DAYS = 60;

export interface IWindowRow {
  transaction: IScheduledTransaction;
  balance: number; // after this row, rounded to cents
}

export interface IScheduleWindow {
  rows: IWindowRow[];
  lowest: { amount: number; date: Temporal.PlainDate };
  endsInWindow: boolean;
}

export function withRunningBalance(result: IRunwayResult): IWindowRow[] {
  let balance = result.startingBalance;
  return result.scheduled.map((transaction) => {
    balance = roundToCents(balance + transaction.amount);
    return { transaction, balance };
  });
}

// The rows dated on or before today + days, the lowest balance among them (the starting balance,
// dated today, counts too), and whether the runway runs out inside that window.
export function scheduleWindow(result: IRunwayResult, today: Temporal.PlainDate, days: number): IScheduleWindow {
  const lastDay = today.add({ days });
  const inWindow = (date: Temporal.PlainDate) => Temporal.PlainDate.compare(date, lastDay) <= 0;

  const rows = withRunningBalance(result).filter((row) => inWindow(row.transaction.date));
  let lowest = { amount: result.startingBalance, date: today };
  for (const row of rows) {
    if (row.balance < lowest.amount) {
      lowest = { amount: row.balance, date: row.transaction.date };
    }
  }

  return {
    rows,
    lowest,
    endsInWindow: result.runwayEndDate !== null && inWindow(result.runwayEndDate),
  };
}
