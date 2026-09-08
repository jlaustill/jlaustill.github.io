import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ExpectedInflowsEditor from './ExpectedInflowsEditor';

describe('ExpectedInflowsEditor', () => {
  it('renders each entry with its current name, amount, and date', () => {
    render(
      <ExpectedInflowsEditor
        items={[
          { name: 'Progressive refund', amount: 300, date: null },
          { name: 'Tax refund', amount: 450, date: '2026-04-15' },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByDisplayValue('Progressive refund')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tax refund')).toBeInTheDocument();
    expect(screen.getByDisplayValue('450')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-04-15')).toBeInTheDocument();
  });
});

describe('ExpectedInflowsEditor editing', () => {
  it('calls onChange with the updated amount after editing and blurring', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ExpectedInflowsEditor items={[{ name: 'Refund', amount: 300, date: null }]} onChange={handleChange} />,
    );

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '350');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Refund', amount: 350, date: null }]);
  });
});
