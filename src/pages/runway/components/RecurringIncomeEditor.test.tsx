import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecurringIncomeEditor from './RecurringIncomeEditor';
import type { IRecurringIncome } from '../types/IRunwayData';

// `employer` is a key the editor never shows; it must survive every edit.
const salary = {
  name: 'Salary',
  amount: 2500,
  schedule: 'semi-monthly',
  days: [1, 15],
  employer: 'Example Co',
} satisfies IRecurringIncome & { employer: string };

describe('RecurringIncomeEditor', () => {
  it('shows each income with its name, amount, schedule and days', () => {
    render(<RecurringIncomeEditor items={[salary]} onChange={() => {}} />);

    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('semi-monthly')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1, 15')).toBeInTheDocument();
  });

  it('saves edited paydays as numbers and keeps fields it does not show', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<RecurringIncomeEditor items={[salary]} onChange={handleChange} />);

    const daysInput = screen.getByDisplayValue('1, 15');
    await user.clear(daysInput);
    await user.type(daysInput, '5, 20');
    await user.tab();

    expect(handleChange).toHaveBeenLastCalledWith([{ ...salary, days: [5, 20] }]);
  });

  it('puts the paydays back when the text holds no valid day', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<RecurringIncomeEditor items={[salary]} onChange={handleChange} />);

    const daysInput = screen.getByDisplayValue('1, 15');
    await user.clear(daysInput);
    await user.type(daysInput, 'x');
    await user.tab();

    expect(screen.getByDisplayValue('1, 15')).toBeInTheDocument();
    for (const [items] of handleChange.mock.calls) {
      expect(items[0].days).toEqual([1, 15]);
    }
  });

  it('leaves paydays it would not accept untouched when only tabbed through', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<RecurringIncomeEditor items={[{ ...salary, days: [1, 15, 32] }]} onChange={handleChange} />);

    await user.click(screen.getByDisplayValue('1, 15, 32'));
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('keeps both paydays when the schedule is switched to weekly and back', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<RecurringIncomeEditor items={[salary]} onChange={handleChange} />);

    await user.selectOptions(screen.getByDisplayValue('semi-monthly'), 'weekly');
    await user.click(screen.getByDisplayValue('1, 15'));
    await user.tab();
    await user.selectOptions(screen.getByDisplayValue('weekly'), 'semi-monthly');

    expect(handleChange.mock.calls[handleChange.mock.calls.length - 1][0]).toEqual([salary]);
  });

  it('adds a new income with twice-monthly paydays', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<RecurringIncomeEditor items={[]} onChange={handleChange} />);

    await user.click(screen.getByText('Add Income'));

    expect(handleChange).toHaveBeenCalledWith([{ name: '', amount: 0, schedule: 'semi-monthly', days: [1, 15] }]);
  });

  it('removes an income', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const sideJob = { ...salary, name: 'Side job' };
    render(<RecurringIncomeEditor items={[salary, sideJob]} onChange={handleChange} />);

    await user.click(screen.getAllByLabelText('Remove')[0]);

    expect(handleChange).toHaveBeenCalledWith([sideJob]);
  });
});
