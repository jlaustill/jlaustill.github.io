import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import { SAVE_DELAY_MS } from './hooks/useRunwayFile';
import { parseMoneyInput } from './format';
import { openInPage, settle } from './testUtils/pageRoundTrip';

const today = Temporal.Now.plainDateISO().toString();
const seed = {
  cashOnHand: [{ name: 'Checking', amount: 500, updatedAt: today }],
  expectedInflows: [],
  payments: [{ name: 'Rent', amount: 400, day: 1 }],
  recurringIncome: [{ name: 'Paycheck', amount: 1000, schedule: 'monthly', days: [15] }],
};

describe('RunwayApp', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens on the check-in with the summary, the balances and the next 60 days', async () => {
    await openInPage(JSON.stringify(seed));

    expect(screen.getByRole('tab', { name: 'Check-in', selected: true })).toBeInTheDocument();
    expect(screen.getByText('Cash now')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('Next 60 days')).toBeInTheDocument();

    // Every running balance in the table follows from the one before it. The low point's
    // balance cell also carries a "low" marker.
    let running = 500;
    for (const row of screen.getAllByRole('row').slice(1)) {
      const cells = within(row).getAllByRole('cell');
      running += parseMoneyInput(cells[2].textContent ?? '') ?? Number.NaN;
      const balanceText = (cells[3].textContent ?? '').replace('low', '');
      expect(parseMoneyInput(balanceText)).toBeCloseTo(running, 2);
    }
  }, 60_000);

  it('follows a changed balance through to the summary and the file', async () => {
    const { user, file } = await openInPage(JSON.stringify(seed));

    const field = within(screen.getAllByRole('listitem')[0]).getByLabelText('Balance');
    await user.clear(field);
    await user.type(field, '800');
    await user.tab();

    expect(screen.getByText('$800')).toBeInTheDocument();
    await settle(SAVE_DELAY_MS);
    expect(JSON.parse(file.writes[0]).cashOnHand[0].amount).toBe(800);
  }, 60_000);
});
