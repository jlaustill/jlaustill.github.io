import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
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

  it('dates a balance edit with the day it is made, not the day the page was opened', async () => {
    vi.setSystemTime(new Date(2026, 10, 19, 23, 59));
    const { user, file } = await openInPage(JSON.stringify(seed));
    vi.setSystemTime(new Date(2026, 10, 21, 8, 0));
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    const field = within(screen.getAllByRole('listitem')[0]).getByLabelText('Balance');
    await user.clear(field);
    await user.type(field, '800');
    await user.tab();
    await settle(SAVE_DELAY_MS);

    expect(JSON.parse(file.writes[0]).cashOnHand[0].updatedAt).toBe('2026-11-21');
  }, 60_000);

  it('saves a balance still being typed in when the tab is about to close', async () => {
    const { user, file } = await openInPage(JSON.stringify(seed));
    const field = within(screen.getAllByRole('listitem')[0]).getByLabelText('Balance');
    await user.clear(field);
    await user.type(field, '800');

    const leaving = new Event('beforeunload', { cancelable: true });
    act(() => {
      window.dispatchEvent(leaving);
    });

    expect(leaving.defaultPrevented).toBe(true);
    await settle(SAVE_DELAY_MS);
    expect(JSON.parse(file.writes[0]).cashOnHand[0].amount).toBe(800);
  }, 60_000);

  it('asks before opening another file would throw away changes that cannot be saved', async () => {
    const { user } = await openInPage(JSON.stringify(seed), { permission: 'denied' });
    const picker = vi.mocked(window.showOpenFilePicker);
    const field = within(screen.getAllByRole('listitem')[0]).getByLabelText('Balance');
    await user.clear(field);
    await user.type(field, '800');
    await user.tab();
    picker.mockClear();

    await user.click(screen.getByRole('button', { name: 'Open a different file' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('not saved');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    await settle(500);
    expect(picker).not.toHaveBeenCalled();
    expect(screen.getByText('$800')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open a different file' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Discard and open' }));
    expect(picker).toHaveBeenCalledTimes(1);
  }, 60_000);
});
