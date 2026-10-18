import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import RunwaySchedule from './RunwaySchedule';
import type { IRunwaySchedule } from '../engine/runwayEngine';

describe('RunwaySchedule', () => {
  it('shows the runway end date and stopped-at payment when the runway ends', () => {
    const schedule: IRunwaySchedule = {
      startingBalance: 100,
      scheduled: [{ date: Temporal.PlainDate.from('2026-09-08'), name: 'Groceries', amount: -50 }],
      runwayEndDate: Temporal.PlainDate.from('2026-09-30'),
      stoppedAtName: 'Rent',
    };
    render(<RunwaySchedule schedule={schedule} />);

    expect(screen.getByText(/Runway ends 2026-09-30, before Rent/)).toBeInTheDocument();
    expect(screen.getByText(/Groceries/)).toBeInTheDocument();
  });

  it('shows an open-ended message when the runway extends beyond the projection window', () => {
    const schedule: IRunwaySchedule = {
      startingBalance: 1000000,
      scheduled: [],
      runwayEndDate: null,
      stoppedAtName: null,
    };
    render(<RunwaySchedule schedule={schedule} />);

    expect(screen.getByText(/Runway extends beyond the projection window/)).toBeInTheDocument();
  });
});
