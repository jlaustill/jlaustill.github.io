import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DepositsEditor from './DepositsEditor';

describe('DepositsEditor', () => {
  it('renders the entry with its current name, amount, frequency, and day', () => {
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByDisplayValue('Paycheck')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('monthly')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
  });
});

describe('DepositsEditor editing', () => {
  it('calls onChange with the updated frequency', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={handleChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Frequency'), 'weekly');

    expect(handleChange).toHaveBeenCalledWith([
      { name: 'Paycheck', amount: 1500, frequency: 'weekly', day: 25 },
    ]);
  });
});
