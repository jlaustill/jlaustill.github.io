import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import RunwaySchedule from './RunwaySchedule';
import type { IRunwayResult } from '../types/IRunwayResult';

const date = (isoDate: string) => Temporal.PlainDate.from(isoDate);

describe('RunwaySchedule', () => {
  it('shows the runway end date and stopped-at payment when the runway ends', () => {
    const result: IRunwayResult = {
      startingBalance: 100,
      scheduled: [{ date: date('2026-09-08'), name: 'Groceries', amount: -50 }],
      runwayEndDate: date('2026-09-30'),
      stoppedAtName: 'Rent',
      lowestBalance: { amount: 50, date: date('2026-09-08') },
      payoffs: [],
    };
    render(<RunwaySchedule result={result} />);

    expect(screen.getByText(/Runway ends 2026-09-30, before Rent/)).toBeInTheDocument();
    expect(screen.getByText(/Groceries/)).toBeInTheDocument();
  });

  it('shows an open-ended message when the runway extends beyond the projection window', () => {
    const result: IRunwayResult = {
      startingBalance: 1000000,
      scheduled: [],
      runwayEndDate: null,
      stoppedAtName: null,
      lowestBalance: { amount: 1000000, date: date('2026-09-08') },
      payoffs: [],
    };
    render(<RunwaySchedule result={result} />);

    expect(screen.getByText(/Runway extends beyond the projection window/)).toBeInTheDocument();
  });
});
