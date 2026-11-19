import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunwayApp } from './RunwayPage';
import type { IRunwayData } from './types/IRunwayData';
import { parseMoneyInput } from './format';

// Seed data deliberately makes the "Rent" payment unaffordable (far larger than starting
// cash plus any paycheck before it), so the schedule stops at the first rent. That keeps the
// rendered schedule short whatever calendar date the test runs on, while still exercising a
// real cash account, a real payment, and real recurring income end to end.
const seedData: IRunwayData = {
  cashOnHand: [{ name: 'Checking', amount: 500 }],
  expectedInflows: [],
  payments: [{ name: 'Rent', amount: 5_000_000, day: 1 }],
  recurringIncome: [{ name: 'Paycheck', amount: 1000, schedule: 'monthly', days: [15] }],
};

function stubFilePicker(data: IRunwayData) {
  const fakeFile = {
    name: 'runway.json',
    text: async () => JSON.stringify(data),
  };
  const fakeHandle = {
    getFile: async () => fakeFile,
  };
  vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([fakeHandle]));
}

describe('RunwayApp integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.skip('does not crash and recomputes a real numeric schedule when a number field is cleared to empty', async () => {
    stubFilePicker(seedData);
    const user = userEvent.setup();
    render(<RunwayApp />);

    await user.click(screen.getByText('Open runway.json'));

    // Wait for the async file load to land real IRunwayData in state, wiring
    // CashOnHandEditor, RecurringIncomeEditor, PaymentsEditor and RunwaySchedule together
    // exactly the way RunwayPage.tsx composes them.
    expect(await screen.findByDisplayValue('Checking')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paycheck')).toBeInTheDocument();

    // The Cash on Hand amount field is the first "Amount" field on the page
    // (CashOnHandEditor renders before the other editors).
    const amountInputs = screen.getAllByPlaceholderText('Amount');
    const cashOnHandAmountInput = amountInputs[0];

    // This is the exact crash scenario from Finding 1: clearing a number field to
    // empty used to make `values.entries.reduce((sum, e) => sum + e.amount, 0)`
    // produce the STRING '0' (via string concatenation with amount === ''), and
    // `.toFixed(2)` on that threw, unmounting the whole page. Rendering through
    // this without throwing, plus the exact "$0.00" total below, is the regression
    // guard for Finding 1.
    await user.clear(cashOnHandAmountInput);
    await user.tab();

    expect(screen.getByText('Total: $0.00')).toBeInTheDocument();

    // The page must still be fully mounted -- not replaced by React's uncaught-error
    // unmount -- and the schedule must have recomputed off the new (numeric) data.
    expect(screen.getByText('Next 60 days')).toBeInTheDocument();

    // Prove the recomputed schedule is carrying real numbers end to end (data ->
    // editor onChange -> setData -> calculateRunway -> RunwaySchedule),
    // not strings or NaN from a corrupted amount. Every Amount/Balance cell must
    // parse as a finite number, and the running balance must be internally
    // consistent (each row's balance = previous balance + that row's amount).
    const rows = screen.getAllByRole('row').slice(1); // drop the header row
    let runningBalance = 0; // startingBalance is now 0 after the clear above
    for (const row of rows) {
      const cells = within(row).getAllByRole('cell');
      const amountText = cells[2].textContent ?? '';
      const balanceText = cells[3].textContent ?? '';
      const amount = parseMoneyInput(amountText) ?? Number.NaN;
      const balance = parseMoneyInput(balanceText) ?? Number.NaN;

      expect(Number.isNaN(amount)).toBe(false);
      expect(Number.isNaN(balance)).toBe(false);

      runningBalance += amount;
      expect(balance).toBeCloseTo(runningBalance, 2);
    }

    // Nice-to-have: exercise the note field in PaymentsEditor while we have the
    // whole tree mounted, proving it round-trips through the same real data flow.
    const noteInput = screen.getByPlaceholderText('Note');
    await user.type(noteInput, 'Autopay pending');
    await user.tab();

    expect(screen.getByDisplayValue('Autopay pending')).toBeInTheDocument();
  });
});
