import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PaymentsEditor from './PaymentsEditor';

describe('PaymentsEditor', () => {
  it('renders each entry with its current name, amount, day, and creditor', () => {
    render(
      <PaymentsEditor
        items={[
          { name: 'SoFi Personal Loan', amount: 0, day: 6, creditor: 'SoFi', pastDue: 1530.64 },
          { name: 'Rent', amount: 1200, day: 1 },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByDisplayValue('SoFi Personal Loan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SoFi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1200')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText(/past due \$1530.64/)).toBeInTheDocument();
  });
});

describe('PaymentsEditor editing', () => {
  it('calls onChange with the updated amount after editing and blurring', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Rent', amount: 1200, day: 1 }]} onChange={handleChange} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '1250');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Rent', amount: 1250, day: 1 }]);
  });

  it('preserves pastDue in the onChange payload even though it has no editable field', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentsEditor
        items={[{ name: 'SoFi Personal Loan', amount: 0, day: 6, pastDue: 1530.64 }]}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByPlaceholderText('Day'));
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([
      { name: 'SoFi Personal Loan', amount: 0, day: 6, pastDue: 1530.64 },
    ]);
  });

  it('coerces an emptied amount field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Rent', amount: 1200, day: 1 }]} onChange={handleChange} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.tab();

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([{ name: 'Rent', amount: 0, day: 1 }]);
    expect(typeof lastCall[0].amount).toBe('number');
  });

  it('coerces an emptied day field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Rent', amount: 1200, day: 1 }]} onChange={handleChange} />);

    const dayInput = screen.getByPlaceholderText('Day');
    await user.clear(dayInput);
    await user.tab();

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([{ name: 'Rent', amount: 1200, day: 0 }]);
    expect(typeof lastCall[0].day).toBe('number');
  });
});
