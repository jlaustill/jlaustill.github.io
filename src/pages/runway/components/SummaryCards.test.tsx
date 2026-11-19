import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import SummaryCards from './SummaryCards';
import type { IRunwayResult } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-11-19');

const result = (overrides: Partial<IRunwayResult> = {}): IRunwayResult => ({
  startingBalance: 1525,
  scheduled: [
    { date: date('2026-11-20'), name: 'Rent', amount: -500 },
    { date: date('2026-12-01'), name: 'Salary', amount: 2500 },
  ],
  runwayEndDate: null,
  stoppedAtName: null,
  lowestBalance: { amount: 1025, date: date('2026-11-20') },
  payoffs: [],
  ...overrides,
});

describe('SummaryCards', () => {
  it('shows the cash on hand and how many accounts hold it', () => {
    render(<SummaryCards result={result()} accountCount={3} today={today} />);

    expect(screen.getByText('$1,525')).toBeInTheDocument();
    expect(screen.getByText('3 accounts')).toBeInTheDocument();
  });

  it('says "1 account" for a single account', () => {
    render(<SummaryCards result={result()} accountCount={1} today={today} />);

    expect(screen.getByText('1 account')).toBeInTheDocument();
  });

  it('shows the lowest balance in the next 60 days and its date', () => {
    render(<SummaryCards result={result()} accountCount={3} today={today} />);

    expect(screen.getByText('$1,025')).toBeInTheDocument();
    expect(screen.getByText('Nov 20')).toBeInTheDocument();
  });

  it('says the runway extends beyond 10 years when nothing stops it', () => {
    render(<SummaryCards result={result()} accountCount={3} today={today} />);

    expect(screen.getByText('10+ years')).toBeInTheDocument();
    expect(screen.getByText('No shortfall ahead')).toBeInTheDocument();
  });

  it('says when the runway ends and before which payment', () => {
    render(
      <SummaryCards
        result={result({ runwayEndDate: date('2027-01-30'), stoppedAtName: 'Bill' })}
        accountCount={3}
        today={today}
      />,
    );

    expect(screen.getByText('Ends Jan 30, 2027')).toBeInTheDocument();
    expect(screen.getByText('before Bill')).toBeInTheDocument();
  });

  it('flags a lower balance that comes after the 60 days', () => {
    render(
      <SummaryCards
        result={result({ lowestBalance: { amount: 310, date: date('2027-04-03') } })}
        accountCount={3}
        today={today}
      />,
    );

    expect(screen.getByText('Lowest later: $310 on Apr 3, 2027')).toBeInTheDocument();
  });

  it('leaves out the later low when nothing later is lower', () => {
    render(<SummaryCards result={result()} accountCount={3} today={today} />);

    expect(screen.queryByText(/Lowest later/)).not.toBeInTheDocument();
  });
});
