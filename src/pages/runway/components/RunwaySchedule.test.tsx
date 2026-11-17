import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Temporal } from '@js-temporal/polyfill';
import RunwaySchedule from './RunwaySchedule';
import type { IRunwayResult, IScheduledTransaction } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);
const today = date('2026-11-16'); // 90 days later is 2027-02-14

const result = (startingBalance: number, scheduled: IScheduledTransaction[]): IRunwayResult => ({
  startingBalance,
  scheduled,
  runwayEndDate: null,
  stoppedAtName: null,
  lowestBalance: { amount: startingBalance, date: today },
  payoffs: [],
});

const bodyRows = () => screen.getAllByRole('row').slice(1);
const cellText = (row: HTMLElement, column: number) => within(row).getAllByRole('cell')[column].textContent;

describe('RunwaySchedule', () => {
  it('shows only the next 90 days until asked for everything', async () => {
    const user = userEvent.setup();
    render(
      <RunwaySchedule
        result={result(1000, [
          { date: date('2026-11-20'), name: 'Groceries', amount: -50 },
          { date: date('2027-02-14'), name: 'Groceries', amount: -50 },
          { date: date('2027-03-01'), name: 'Groceries', amount: -50 },
        ])}
        today={today}
      />,
    );

    expect(bodyRows().map((row) => cellText(row, 0))).toEqual(['2026-11-20', '2027-02-14']);

    await user.click(screen.getByText('Show all (1 more)'));
    expect(bodyRows().map((row) => cellText(row, 0))).toEqual(['2026-11-20', '2027-02-14', '2027-03-01']);

    await user.click(screen.getByText('Show next 90 days'));
    expect(bodyRows()).toHaveLength(2);
  });

  it('keeps a running balance across every row', () => {
    render(
      <RunwaySchedule
        result={result(100, [
          { date: date('2026-11-20'), name: 'Salary', amount: 200 },
          { date: date('2026-11-25'), name: 'Power', amount: -50.25 },
        ])}
        today={today}
      />,
    );

    expect(bodyRows().map((row) => cellText(row, 3))).toEqual(['300.00', '249.75']);
  });

  it('offers no toggle when every row fits in the next 90 days', () => {
    render(
      <RunwaySchedule result={result(100, [{ date: date('2026-11-20'), name: 'Power', amount: -50 }])} today={today} />,
    );

    expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
  });
});
