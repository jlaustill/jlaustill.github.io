export interface ICashOnHandEntry {
  name: string;
  amount: number;
  institution?: string;
  note?: string;
}

export interface IExpectedInflow {
  name: string;
  amount: number | null; // null when the amount is not known yet
  date: string | null;
  expectedMonth?: string | null; // free text; counted only when it is an exact YYYY-MM
  confirmed?: boolean;
  note?: string;
}

export type TIncomeSchedule = 'semi-monthly' | 'monthly' | 'weekly';

export interface IRecurringIncome {
  name: string;
  amount: number; // per payday
  schedule: TIncomeSchedule;
  days: number[]; // days of the month, or ISO weekdays 1 (Monday) to 7 (Sunday) when weekly
  startDate?: string;
  endDate?: string;
  note?: string;
}

export interface IPaymentPlan {
  amount: number;
  dueDates: string[]; // YYYY-MM-DD; replaces the regular payment until the last date has passed
}

export interface IPayment {
  name: string;
  amount: number;
  shouldBe?: number;
  pastDue?: number | null;
  day: number;
  balance?: number;
  interestRate?: number; // annual percentage as printed: 24.99 means 24.99%
  escrow?: number; // mortgage only
  paymentPlan?: IPaymentPlan;
  creditor?: string;
  merchant?: string;
  type?: string;
  collateral?: string | null;
  disposition?: 'keep' | 'cancel' | null;
  chargeOffDate?: string | null;
  updatedAt?: string | null;
  note?: string;
  reinstatementDue?: string;
  revertsToMonthlyPayment?: number;
}

export interface IDeposit {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  day: number;
  startDate?: string;
  endDate?: string;
  occurrences?: number;
}

export interface IRunwayData {
  cashOnHand: ICashOnHandEntry[];
  expectedInflows: IExpectedInflow[];
  payments: IPayment[];
  deposits: IDeposit[];
}
