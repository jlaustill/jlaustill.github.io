import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import RunwaySummary from './RunwaySummary';
import type { IRunwayResult } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);

const result = (overrides: Partial<IRunwayResult>): IRunwayResult => ({
  startingBalance: 1000,
  scheduled: [],
  runwayEndDate: null,
  stoppedAtName: null,
  lowestBalance: { amount: 100, date: date('2026-11-18') },
  payoffs: [],
  ...overrides,
});

describe('RunwaySummary', () => {
  it('says when the runway ends and which payment it stops at', () => {
    render(<RunwaySummary result={result({ runwayEndDate: date('2027-01-30'), stoppedAtName: 'Bill' })} />);

    expect(screen.getByText('Runway ends 2027-01-30, before Bill')).toBeInTheDocument();
  });

  it('says the runway extends beyond 10 years when nothing stops it', () => {
    render(<RunwaySummary result={result({})} />);

    expect(screen.getByText('Runway extends beyond 10 years')).toBeInTheDocument();
  });

  it('shows the lowest projected balance and its date', () => {
    render(<RunwaySummary result={result({})} />);

    expect(screen.getByText('Lowest balance: $100.00 on 2026-11-18')).toBeInTheDocument();
  });

  it('describes every kind of payoff projection', () => {
    render(
      <RunwaySummary
        result={result({
          payoffs: [
            { name: 'Plan', projection: { status: 'paidOff', date: date('2027-01-20') } },
            { name: 'Card', projection: { status: 'neverPaysOff' } },
            { name: 'Home', projection: { status: 'beyondHorizon' } },
            { name: 'Loan', projection: { status: 'missingValues', fields: ['interestRate', 'escrow'] } },
          ],
        })}
      />,
    );

    expect(screen.getByText('Debt payoff, if every payment is made')).toBeInTheDocument();
    expect(screen.getByText('Plan: paid off 2027-01-20')).toBeInTheDocument();
    expect(screen.getByText('Card: never at the current payment')).toBeInTheDocument();
    expect(screen.getByText('Home: beyond 10 years')).toBeInTheDocument();
    expect(screen.getByText('Loan: needs interest rate, escrow')).toBeInTheDocument();
  });

  it('leaves out the payoff list when there are no debts', () => {
    render(<RunwaySummary result={result({})} />);

    expect(screen.queryByText('Debt payoff, if every payment is made')).not.toBeInTheDocument();
  });
});
