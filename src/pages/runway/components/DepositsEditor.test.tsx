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

  it("keeps Formik's own state in sync on a frequency change even when the parent's onChange never echoes the value back", async () => {
    // Identical clobbering mechanism to the onBlur bug Task 10 already fixed: if the
    // frequency field's onChange fully replaces Formik's own handleChange instead of
    // calling it, Formik's internal state never updates. The existing "calls onChange
    // with the updated frequency" test above cannot catch this on its own, because the
    // component only appears to work when the parent round-trips the new value back
    // through `enableReinitialize`. Using a non-echoing onChange here isolates Formik's
    // own state from that round-trip.
    const nonEchoingOnChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={nonEchoingOnChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Frequency'), 'weekly');

    expect(screen.getByDisplayValue('weekly')).toBeInTheDocument();
  });

  it('coerces an emptied amount field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={handleChange}
      />,
    );

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.tab();

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([{ name: 'Paycheck', amount: 0, frequency: 'monthly', day: 25 }]);
    expect(typeof lastCall[0].amount).toBe('number');
  });

  it('coerces an emptied day field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={handleChange}
      />,
    );

    const dayInput = screen.getByPlaceholderText('Day');
    await user.clear(dayInput);
    await user.tab();

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 0 }]);
    expect(typeof lastCall[0].day).toBe('number');
  });
});
