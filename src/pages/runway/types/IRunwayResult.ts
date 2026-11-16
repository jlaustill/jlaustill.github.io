import type { Temporal } from '@js-temporal/polyfill';
import type { TDebtField } from '../engine/debt';

export interface IScheduledTransaction {
  date: Temporal.PlainDate;
  name: string;
  amount: number; // positive = money in, negative = money out
  paidOff?: boolean; // this payment cleared the debt's balance
}

export type TPayoffProjection =
  | { status: 'paidOff'; date: Temporal.PlainDate }
  | { status: 'neverPaysOff' } // the regular payment does not cover the interest, or payments stop first
  | { status: 'beyondHorizon' }
  | { status: 'missingValues'; fields: TDebtField[] };

export interface IDebtPayoff {
  name: string;
  projection: TPayoffProjection;
}

export interface IRunwayResult {
  startingBalance: number;
  scheduled: IScheduledTransaction[];
  runwayEndDate: Temporal.PlainDate | null; // null: beyond the horizon, or nothing left to pay
  stoppedAtName: string | null;
  lowestBalance: { amount: number; date: Temporal.PlainDate };
  payoffs: IDebtPayoff[];
}
