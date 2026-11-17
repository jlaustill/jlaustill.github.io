import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpectedInflowsEditor from './ExpectedInflowsEditor';
import type { IExpectedInflow } from '../types/IRunwayData';

// `gross` and `note` are keys the editor never shows; they must survive every edit.
const bonus = {
  name: 'Bonus',
  amount: 900,
  gross: 1400,
  date: null,
  expectedMonth: '2027-03',
  confirmed: true,
  note: 'After tax',
} satisfies IExpectedInflow & { gross: number };

const lastPayload = (handleChange: ReturnType<typeof vi.fn>) =>
  handleChange.mock.calls[handleChange.mock.calls.length - 1][0];

describe('ExpectedInflowsEditor', () => {
  // This must run first in the file: React's dev-mode "`value` prop on `input` should not be
  // null" warning is only ever logged ONCE per process (guarded by an internal flag in
  // react-dom), so if any earlier render in this file already tripped it, a console.error spy
  // here would see nothing regardless of whether the bug is actually fixed.
  it('renders a null date and a null amount as empty inputs, without a React warning', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <ExpectedInflowsEditor
        items={[
          { name: 'Unknown amount', amount: null, date: null },
          { name: 'Refund', amount: 450, date: '2027-04-15' },
        ]}
        onChange={() => {}}
      />,
    );

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect((dateInputs[0] as HTMLInputElement).value).toBe('');
    expect((dateInputs[1] as HTMLInputElement).value).toBe('2027-04-15');
    expect((screen.getAllByPlaceholderText('Amount')[0] as HTMLInputElement).value).toBe('');

    const gotNullValueWarning = consoleErrorSpy.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('should not be null')),
    );
    expect(gotNullValueWarning).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('shows the name, amount, expected month and confirmation', () => {
    render(<ExpectedInflowsEditor items={[bonus]} onChange={() => {}} />);

    expect(screen.getByDisplayValue('Bonus')).toBeInTheDocument();
    expect(screen.getByDisplayValue('900')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2027-03')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Confirmed' })).toBeChecked();
  });
});

describe('ExpectedInflowsEditor editing', () => {
  it('saves an edited amount and keeps fields it does not show', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<ExpectedInflowsEditor items={[bonus]} onChange={handleChange} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '950');
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ ...bonus, amount: 950 }]);
  });

  it('saves a cleared amount as null, never 0', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<ExpectedInflowsEditor items={[bonus]} onChange={handleChange} />);

    await user.clear(screen.getByPlaceholderText('Amount'));
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ ...bonus, amount: null }]);
  });

  it('saves a cleared date as null, never an empty string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ExpectedInflowsEditor items={[{ ...bonus, date: '2027-02-10' }]} onChange={handleChange} />,
    );

    await user.clear(container.querySelector('input[type="date"]') as HTMLInputElement);
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ ...bonus, date: null }]);
  });

  it('leaves an approximate expected month exactly as it was when tabbed through', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<ExpectedInflowsEditor items={[{ ...bonus, expectedMonth: '~2031' }]} onChange={handleChange} />);

    await user.click(screen.getByDisplayValue('~2031'));
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ ...bonus, expectedMonth: '~2031' }]);
  });

  it('saves a cleared expected month as null', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<ExpectedInflowsEditor items={[bonus]} onChange={handleChange} />);

    await user.clear(screen.getByPlaceholderText('YYYY-MM'));
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ ...bonus, expectedMonth: null }]);
  });

  it('flips confirmation when the checkbox is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<ExpectedInflowsEditor items={[bonus]} onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Confirmed' }));

    expect(lastPayload(handleChange)).toEqual([{ ...bonus, confirmed: false }]);
  });

  it('adds a new inflow that counts for nothing until it is filled in', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<ExpectedInflowsEditor items={[]} onChange={handleChange} />);

    await user.click(screen.getByText('Add Expected Inflow'));

    expect(handleChange).toHaveBeenCalledWith([
      { name: '', amount: null, date: null, expectedMonth: null, confirmed: false },
    ]);
  });
});
