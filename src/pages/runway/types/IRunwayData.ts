export interface ICashOnHandEntry {
  name: string;
  amount: number;
  institution?: string;
  note?: string;
}

export interface IExpectedInflow {
  name: string;
  amount: number;
  date: string | null;
  note?: string;
}

export interface IPayment {
  name: string;
  amount: number;
  shouldBe?: number;
  pastDue?: number | null;
  day: number;
  balance?: number;
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
