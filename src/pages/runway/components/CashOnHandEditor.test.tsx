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
});
