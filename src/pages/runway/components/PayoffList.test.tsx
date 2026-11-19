import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import PayoffList from './PayoffList';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);

describe('PayoffList', () => {
  it('describes every kind of payoff projection', () => {
    render(
      <PayoffList
        payoffs={[
          { name: 'Plan', projection: { status: 'paidOff', date: date('2027-01-20') } },
          { name: 'Card', projection: { status: 'neverPaysOff' } },
          { name: 'Home', projection: { status: 'beyondHorizon' } },
          { name: 'Loan', projection: { status: 'missingValues', fields: ['interestRate', 'escrow'] } },
        ]}
      />,
    );

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Paid off Jan 20, 2027')).toBeInTheDocument();
    expect(screen.getByText('Never at current payment')).toBeInTheDocument();
    expect(screen.getByText('Beyond 10 years')).toBeInTheDocument();
    expect(screen.getByText('Needs interest rate, escrow')).toBeInTheDocument();
  });

  it('says so when there are no debts to project', () => {
    render(<PayoffList payoffs={[]} />);

    expect(screen.getByText('No debts with balances on file')).toBeInTheDocument();
  });
});
