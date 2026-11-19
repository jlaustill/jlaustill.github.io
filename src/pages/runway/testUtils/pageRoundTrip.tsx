import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RunwayApp } from '../RunwayPage';
import { createFakeFile, stubFilePicker, type IFakeFile } from './fakeFileHandle';

// A made-up file with the same shape as a real one: null amounts and dates, an approximate
// month, keys the page never displays at every level (including inside a payment plan), and
// fake account numbers. Every value here is invented.
export const liveShapedFile = {
  cashOnHand: [
    {
      name: 'Checking',
      amount: 1200,
      institution: 'Example Bank',
      accountNumber: '0000000000',
      routingNumber: '000000000',
      note: 'Primary account',
      updatedAt: '2026-11-01',
    },
    { name: 'Cash', amount: 0 },
    // Balances a hand edit can leave behind: fractions of a cent, and no amount at all.
    { name: 'Brokerage', amount: 1234.567, updatedAt: '2026-10-01' },
    { name: 'Unknown', amount: null },
  ],
  expectedInflows: [
    {
      name: 'Bonus',
      amount: 900,
      gross: 1400,
      date: null,
      expectedMonth: '2027-03',
      confirmed: true,
      note: 'After tax',
    },
    { name: 'Maybe later', amount: null, gross: 5000, date: null, expectedMonth: '~2031', confirmed: false },
  ],
  recurringIncome: [
    {
      name: 'Salary',
      amount: 2500,
      schedule: 'semi-monthly',
      days: [1, 15],
      employer: 'Example Co',
      type: 'salary',
      disposition: 'keep',
      note: 'Net pay',
      updatedAt: '2026-11-01',
    },
    // Shapes a hand edit can leave behind. The page must save each one back exactly as it was.
    { name: 'Odd days', amount: 100, schedule: 'monthly', days: [1, 15, 32] },
    { name: 'Weekly gig', amount: 50, schedule: 'weekly', days: [1, 15] },
    { name: 'Text days', amount: 75, schedule: 'semi-monthly', days: ['1', '15'] },
    { name: 'Odd schedule', amount: 60, schedule: 'quarterly', days: [1], endDate: '2027-03' },
  ],
  payments: [
    {
      name: 'Power',
      amount: 120,
      day: 3,
      type: 'utility',
      shouldBe: 120,
      pastDue: null,
      disposition: 'keep',
      updatedAt: null,
    },
    {
      name: 'Card',
      amount: 300,
      day: 9,
      type: 'creditCard',
      balance: 4000,
      creditor: 'Example Card Co',
      cardEnding: '0000',
      chargeOffDate: null,
      collateral: null,
      note: '',
    },
    {
      name: 'Home',
      amount: 1800,
      day: 1,
      type: 'mortgage',
      balance: 150000,
      reinstatedOn: '2026-01-01',
      reinstatementConfirmation: 'EXAMPLE-1',
    },
    {
      name: 'Store plan',
      amount: 0,
      day: 12,
      type: 'collection',
      balance: 600,
      merchant: 'Example Store',
      paymentPlan: {
        amount: 200,
        frequency: 'monthly',
        dueDates: ['2027-01-12', '2027-02-12', '2027-03-12'],
        finalAmount: 200,
        paymentMethod: 'Example card 0000',
        confirmationReferenceId: 'example-reference',
      },
    },
    {
      name: 'Vehicle',
      amount: 250,
      day: 20,
      type: 'secured',
      balance: 3000,
      interestRate: 9.9,
      payoff: 3050,
      collateral: 'Example vehicle',
    },
    { name: 'Old subscription', amount: 0, day: 6, type: 'subscription', shouldBe: 10, disposition: 'cancel' },
  ],
  extraTopLevelKey: { kept: true },
};

export const RUNWAY_TABS = ['Check-in', 'Income', 'Bills & debts', 'Payoff'];

type TUser = ReturnType<typeof userEvent.setup>;

// Renders the real page and opens `fileText` from a fake file. Call
// vi.useFakeTimers({ shouldAdvanceTime: true }) first (user-event stalls on a frozen clock):
// saving and the outside-edit checks run on timers.
export async function openInPage(
  fileText: string,
  options: { permission?: PermissionState } = {},
): Promise<{ user: TUser; file: IFakeFile }> {
  const file = createFakeFile(fileText, options);
  stubFilePicker(file);
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<RunwayApp />);
  await user.click(screen.getByRole('button', { name: 'Open runway.json' }));
  // findBy* waits on timers, which fake timers freeze; flush the open step explicitly instead.
  for (let attempt = 0; attempt < 20 && !screen.queryByRole('tab', { name: 'Check-in' }); attempt++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
  }
  if (!screen.queryByRole('tab', { name: 'Check-in' })) {
    throw new Error('The page did not open the file');
  }
  return { user, file };
}

// Opens every tab and moves focus through every field and button on it, typing nothing.
export async function visitEveryTabAndField(user: TUser): Promise<void> {
  for (const name of RUNWAY_TABS) {
    await user.click(screen.getByRole('tab', { name }));
    const focusable = document.querySelectorAll('input, select, textarea, button').length;
    for (let i = 0; i <= focusable; i++) {
      await user.tab();
    }
  }
}

// Lets any waiting save, and any outside-edit check, run.
export const settle = (ms = 5000) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
