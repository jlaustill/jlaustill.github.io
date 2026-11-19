import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Temporal } from '@js-temporal/polyfill';
import BalancesCard from './BalancesCard';
import type { ICashOnHandEntry } from '../types/IRunwayData';

const today = Temporal.PlainDate.from('2026-11-19');

// `accountNumber` is a key the card never shows; it must survive every edit.
const checking = {
  name: 'Checking',
  amount: 1200,
  institution: 'Example Bank',
  updatedAt: '2026-11-09',
  accountNumber: '0000',
} satisfies ICashOnHandEntry & { accountNumber: string };
const savings: ICashOnHandEntry = { name: 'Savings', amount: 300, updatedAt: '2026-11-19' };

const rows = () => screen.getAllByRole('listitem');
const balanceIn = (row: HTMLElement) => within(row).getByLabelText('Balance') as HTMLInputElement;

function renderCard(items: ICashOnHandEntry[] = [checking, savings]) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<BalancesCard items={items} onChange={onChange} today={today} />);
  return { onChange, user };
}

describe('BalancesCard', () => {
  it('shows each account with its institution, how old it is, and its balance', () => {
    renderCard();

    const [checkingRow] = rows();
    expect(within(checkingRow).getByText('Checking')).toBeInTheDocument();
    expect(within(checkingRow).getByText('Example Bank')).toBeInTheDocument();
    expect(within(checkingRow).getByText('Updated 10 days ago')).toBeInTheDocument();
    expect(balanceIn(checkingRow).value).toBe('1,200.00');
  });

  it('flags stale and undated balances, and not fresh ones', () => {
    renderCard([checking, savings, { name: 'Wallet', amount: 25 }]);

    const [checkingRow, savingsRow, walletRow] = rows();
    expect(within(checkingRow).getByTitle('Needs checking')).toBeInTheDocument();
    expect(within(savingsRow).queryByTitle('Needs checking')).not.toBeInTheDocument();
    expect(within(walletRow).getByText('Not dated')).toBeInTheDocument();
    expect(within(walletRow).getByTitle('Needs checking')).toBeInTheDocument();
  });

  it('leaves an account alone when its balance is only tabbed through', async () => {
    const { onChange, user } = renderCard();

    await user.click(balanceIn(rows()[0]));
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves a balance alone when it is tabbed through, even one the field shows rounded', async () => {
    // A hand edit can leave fractions of a cent, no amount at all, or a number written as text.
    // Showing them rounded must not save them rounded, or date them as checked today.
    const handEdited = [
      { name: 'Fractions', amount: 1234.567 },
      { name: 'Missing', amount: null },
      { name: 'Text', amount: '25' },
    ] as unknown as ICashOnHandEntry[];
    const { onChange, user } = renderCard(handEdited);

    for (const row of rows()) {
      await user.click(balanceIn(row));
      await user.tab();
    }

    expect(onChange).not.toHaveBeenCalled();
  });

  it("saves a new balance with today's date, keeping fields it does not show", async () => {
    const { onChange, user } = renderCard();

    const field = balanceIn(rows()[0]);
    await user.clear(field);
    await user.type(field, '1,250.50');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith([{ ...checking, amount: 1250.5, updatedAt: '2026-11-19' }, savings]);
  });

  it('puts the previous balance back when the text is not an amount', async () => {
    const { onChange, user } = renderCard();

    const field = balanceIn(rows()[0]);
    await user.clear(field);
    await user.type(field, 'abc');
    await user.tab();

    expect(field.value).toBe('1,200.00');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks a balance as checked without changing the amount', async () => {
    const { onChange, user } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Mark Checking as checked' }));

    expect(onChange).toHaveBeenCalledWith([{ ...checking, updatedAt: '2026-11-19' }, savings]);
  });

  it('adds an account only once it has a name, dated today', async () => {
    const { onChange, user } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Add account' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Add' })).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Name/), 'Wallet');
    await user.type(within(dialog).getByLabelText('Balance'), '25');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(onChange).toHaveBeenCalledWith([checking, savings, { name: 'Wallet', amount: 25, updatedAt: '2026-11-19' }]);
  });

  it('starts a new account at 0 when no balance is typed', async () => {
    const { onChange, user } = renderCard([]);

    await user.click(screen.getByRole('button', { name: 'Add account' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText(/Name/), 'Cash');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add' }));

    expect(onChange).toHaveBeenCalledWith([{ name: 'Cash', amount: 0, updatedAt: '2026-11-19' }]);
  });

  it('renames an account and changes nothing else about it', async () => {
    const { onChange, user } = renderCard();

    await user.click(screen.getByRole('button', { name: 'More for Checking' }));
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));
    const nameField = within(screen.getByRole('dialog')).getByLabelText(/Name/);
    await user.clear(nameField);
    await user.type(nameField, 'Main checking');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));

    expect(onChange).toHaveBeenCalledWith([{ ...checking, name: 'Main checking' }, savings]);
  });

  it('asks before deleting, and keeps the other accounts exactly as they were', async () => {
    const { onChange, user } = renderCard([savings, checking]);

    await user.click(screen.getByRole('button', { name: 'More for Savings' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Delete Savings?');
    expect(onChange).not.toHaveBeenCalled();

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(onChange).toHaveBeenCalledWith([checking]);
  });
});
