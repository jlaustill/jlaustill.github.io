import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ExpectedInflowsEditor from './ExpectedInflowsEditor';

describe('ExpectedInflowsEditor', () => {
  // This must run first in the file: React's dev-mode "`value` prop on `input`
  // should not be null" warning is only ever logged ONCE per process (guarded by
  // an internal `didWarnValueNull` flag in react-dom), so if any earlier render in
  // this file already tripped it, a console.error spy here would see nothing
  // regardless of whether the bug is actually fixed.
  it('renders a null-date entry as an empty date input, never the literal string "null", and warns not', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <ExpectedInflowsEditor
        items={[
          { name: 'Progressive refund', amount: 300, date: null },
          { name: 'Tax refund', amount: 450, date: '2026-04-15' },
        ]}
        onChange={() => {}}
      />,
    );

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs).toHaveLength(2);
    expect((dateInputs[0] as HTMLInputElement).value).toBe('');
    expect((dateInputs[1] as HTMLInputElement).value).toBe('2026-04-15');

    const gotNullValueWarning = consoleErrorSpy.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('should not be null')),
    );
    expect(gotNullValueWarning).toBe(false);

    consoleErrorSpy.mockRestore();
  });

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

  it('coerces an emptied amount field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ExpectedInflowsEditor items={[{ name: 'Refund', amount: 300, date: null }]} onChange={handleChange} />,
    );

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.tab();

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([{ name: 'Refund', amount: 0, date: null }]);
    expect(typeof lastCall[0].amount).toBe('number');
  });
});
