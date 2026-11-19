import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Temporal } from '@js-temporal/polyfill';
import NextDaysCard from './NextDaysCard';
import type { IRunwayResult } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-11-19'); // 60 days later is 2027-01-18

const result = (
  startingBalance: number,
  rows: [string, string, number][],
  end: { date: string; name: string } | null = null,
): IRunwayResult => ({
  startingBalance,
  scheduled: rows.map(([isoDate, name, amount]) => ({ date: date(isoDate), name, amount })),
  runwayEndDate: end ? date(end.date) : null,
  stoppedAtName: end ? end.name : null,
  lowestBalance: { amount: startingBalance, date: today },
  payoffs: [],
});

const bodyRows = () => screen.getAllByRole('row').slice(1);
const cellText = (row: HTMLElement, column: number) => within(row).getAllByRole('cell')[column].textContent;

describe('NextDaysCard', () => {
  it('shows only the next 60 days until asked for everything', async () => {
    const user = userEvent.setup();
    render(
      <NextDaysCard
        result={result(1000, [
          ['2026-11-20', 'Groceries', -50],
          ['2027-01-18', 'Groceries', -50],
          ['2027-02-01', 'Groceries', -50],
        ])}
        today={today}
      />,
    );

    expect(bodyRows().map((row) => cellText(row, 0))).toEqual(['Nov 20', 'Jan 18, 2027']);

    await user.click(screen.getByRole('button', { name: 'Show all (1 more)' }));
    expect(bodyRows()).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Show next 60 days' }));
    expect(bodyRows()).toHaveLength(2);
  });

  it('shows signed amounts and a running balance in dollars', () => {
    render(
      <NextDaysCard
        result={result(100, [
          ['2026-11-20', 'Salary', 200],
          ['2026-11-25', 'Power', -50.25],
        ])}
        today={today}
      />,
    );

    expect(bodyRows().map((row) => cellText(row, 2))).toEqual(['+$200.00', '-$50.25']);
    expect(bodyRows().map((row) => cellText(row, 3))).toEqual(['$300.00', '$249.75']);
  });

  it('marks the lowest balance in the window', () => {
    render(
      <NextDaysCard
        result={result(1000, [
          ['2026-11-20', 'Rent', -500],
          ['2026-11-22', 'Salary', 300],
        ])}
        today={today}
      />,
    );

    const [rentRow, salaryRow] = bodyRows();
    expect(rentRow).toHaveTextContent('low');
    expect(salaryRow).not.toHaveTextContent('low');
  });

  it('says when the runway ends inside the window', () => {
    render(<NextDaysCard result={result(100, [], { date: '2026-12-30', name: 'Bill' })} today={today} />);

    expect(screen.getByText('Runway ends Dec 30, 2026, before Bill')).toBeInTheDocument();
  });

  it('offers no toggle when every row fits in the window', () => {
    render(<NextDaysCard result={result(100, [['2026-11-20', 'Power', -50]])} today={today} />);

    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });
});
