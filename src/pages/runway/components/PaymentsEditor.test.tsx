import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsEditor from './PaymentsEditor';
import type { IPayment } from '../types/IRunwayData';

const card: IPayment = { name: 'Card', amount: 300, day: 9, type: 'creditCard', balance: 4000, interestRate: 22 };
const power: IPayment = { name: 'Power', amount: 120, day: 3, type: 'utility' };
const home: IPayment = { name: 'Home', amount: 1800, day: 1, type: 'mortgage', balance: 150000, interestRate: 6, escrow: 450 };

const lastPayload = (handleChange: ReturnType<typeof vi.fn>) =>
  handleChange.mock.calls[handleChange.mock.calls.length - 1][0];

describe('PaymentsEditor', () => {
  it('renders each entry with its current name, amount, day, and creditor', () => {
    render(
      <PaymentsEditor items={[{ name: 'Loan', amount: 300, day: 6, creditor: 'Example Lender' }]} onChange={() => {}} />,
    );

    expect(screen.getByDisplayValue('Loan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Example Lender')).toBeInTheDocument();
  });

  it('shows balance and interest rate for a debt, and neither for a utility', () => {
    render(<PaymentsEditor items={[card, power]} onChange={() => {}} />);

    expect(screen.getAllByPlaceholderText('Balance')).toHaveLength(1);
    expect(screen.getAllByPlaceholderText('Interest rate')).toHaveLength(1);
    expect(screen.getByDisplayValue('4000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('22')).toBeInTheDocument();
  });

  it('shows escrow only for a mortgage', () => {
    render(<PaymentsEditor items={[home, card]} onChange={() => {}} />);

    expect(screen.getAllByPlaceholderText('Escrow')).toHaveLength(1);
    expect(screen.getByDisplayValue('450')).toBeInTheDocument();
  });

  it('shows a payment plan read-only', () => {
    const storePlan: IPayment = {
      name: 'Store plan',
      amount: 300,
      day: 6,
      paymentPlan: { amount: 450, dueDates: ['2026-11-06', '2026-12-06', '2026-10-06'] },
    };
    render(<PaymentsEditor items={[storePlan]} onChange={() => {}} />);

    expect(screen.getByText('Plan: $450.00 on 3 dates, last 2026-12-06')).toBeInTheDocument();
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
    render(<PaymentsEditor items={[{ name: 'Loan', amount: 0, day: 6, pastDue: 500 }]} onChange={handleChange} />);

    await user.click(screen.getByPlaceholderText('Day'));
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Loan', amount: 0, day: 6, pastDue: 500 }]);
  });

  it('coerces an emptied amount field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Rent', amount: 1200, day: 1 }]} onChange={handleChange} />);

    await user.clear(screen.getByPlaceholderText('Amount'));
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ name: 'Rent', amount: 0, day: 1 }]);
    expect(typeof lastPayload(handleChange)[0].amount).toBe('number');
  });

  it('coerces an emptied day field to the number 0, never a string', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Rent', amount: 1200, day: 1 }]} onChange={handleChange} />);

    await user.clear(screen.getByPlaceholderText('Day'));
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ name: 'Rent', amount: 1200, day: 0 }]);
    expect(typeof lastPayload(handleChange)[0].day).toBe('number');
  });

  it('removes a cleared balance instead of saving 0, which would read as paid off', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[card]} onChange={handleChange} />);

    await user.clear(screen.getByPlaceholderText('Balance'));
    await user.tab();

    const { balance: _cleared, ...withoutBalance } = card;
    expect(_cleared).toBe(4000);
    expect(lastPayload(handleChange)).toEqual([withoutBalance]);
    expect(lastPayload(handleChange)[0]).not.toHaveProperty('balance');
  });

  it('saves a typed interest rate as a number', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Card', amount: 300, day: 9, type: 'creditCard', balance: 4000 }]} onChange={handleChange} />);

    await user.type(screen.getByPlaceholderText('Interest rate'), '22.5');
    await user.tab();

    expect(lastPayload(handleChange)[0].interestRate).toBe(22.5);
  });

  it('changes the type from the list, and shows the fields that type needs', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[power]} onChange={handleChange} />);

    await user.selectOptions(screen.getByDisplayValue('utility'), 'mortgage');

    expect(lastPayload(handleChange)).toEqual([{ ...power, type: 'mortgage' }]);
    expect(screen.getByPlaceholderText('Escrow')).toBeInTheDocument();
  });

  it('keeps a payment plan, including keys it does not show, through a name edit', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const storePlan = {
      name: 'Store plan',
      amount: 0,
      day: 12,
      type: 'collection',
      balance: 600,
      paymentPlan: { amount: 200, dueDates: ['2027-01-12', '2027-02-12'], frequency: 'monthly' },
    };
    render(<PaymentsEditor items={[storePlan]} onChange={handleChange} />);

    await user.type(screen.getByDisplayValue('Store plan'), ' 2');
    await user.tab();

    expect(lastPayload(handleChange)).toEqual([{ ...storePlan, name: 'Store plan 2' }]);
  });

  it('keeps a type it does not list when tabbed through', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const pension = { name: 'Pension fund', amount: 50, day: 2, type: 'someOtherKind' };
    render(<PaymentsEditor items={[pension]} onChange={handleChange} />);

    expect(screen.getByDisplayValue('someOtherKind')).toBeInTheDocument();
    await user.click(screen.getByDisplayValue('Pension fund'));
    for (let i = 0; i < 8; i++) {
      await user.tab();
    }

    expect(lastPayload(handleChange)).toEqual([pension]);
  });

  it("keeps the next row's hidden fields when a row is removed", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const homeWithHistory = { ...home, reinstatedOn: '2026-01-01', creditor: 'Example Servicer' };
    render(<PaymentsEditor items={[card, homeWithHistory]} onChange={handleChange} />);

    await user.click(screen.getAllByLabelText('Remove')[0]);

    expect(lastPayload(handleChange)).toEqual([homeWithHistory]);
  });
});
