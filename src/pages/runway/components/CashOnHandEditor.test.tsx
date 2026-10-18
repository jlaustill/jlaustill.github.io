import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CashOnHandEditor from './CashOnHandEditor';

describe('CashOnHandEditor', () => {
  it('renders each account with its current name and amount', () => {
    render(
      <CashOnHandEditor
        items={[
          { name: 'Checking', amount: 83.32, institution: 'Wells Fargo' },
          { name: 'Venmo', amount: 112.99 },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByDisplayValue('Checking')).toBeInTheDocument();
    expect(screen.getByDisplayValue('83.32')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Venmo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('112.99')).toBeInTheDocument();
  });
});

describe('CashOnHandEditor editing', () => {
  it('calls onChange with the updated name after editing and blurring a field', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<CashOnHandEditor items={[{ name: 'Checking', amount: 100 }]} onChange={handleChange} />);

    const nameInput = screen.getByPlaceholderText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Savings');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Savings', amount: 100 }]);
  });

  it('adds a new blank account row when Add Account is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<CashOnHandEditor items={[]} onChange={handleChange} />);

    await user.click(screen.getByText('Add Account'));

    expect(handleChange).toHaveBeenCalledWith([{ name: '', amount: 0 }]);
  });

  it('preserves institution in the onChange payload even though it has no editable field', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CashOnHandEditor
        items={[{ name: 'Checking', amount: 100, institution: 'Wells Fargo' }]}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByPlaceholderText('Amount'));
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([
      { name: 'Checking', amount: 100, institution: 'Wells Fargo' },
    ]);
  });

  it('does not crash and coerces an emptied amount field to the number 0', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<CashOnHandEditor items={[{ name: 'Checking', amount: 100 }]} onChange={handleChange} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);

    // Formik's own documented behavior writes '' into values for an emptied number
    // field. Without coercion at the boundary, `values.entries.reduce((sum, e) =>
    // sum + e.amount, 0)` becomes the STRING '0' and `.toFixed(2)` throws, crashing
    // the whole page. Rendering this far without throwing is itself part of the fix.
    expect(screen.getByText('Total: $0.00')).toBeInTheDocument();

    await user.tab();

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([{ name: 'Checking', amount: 0 }]);
    expect(typeof lastCall[0].amount).toBe('number');
  });
});
