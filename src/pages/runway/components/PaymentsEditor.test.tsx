import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentsEditor from './PaymentsEditor';

describe('PaymentsEditor', () => {
  it('renders name, amount, day, and creditor when present', () => {
    render(
      <PaymentsEditor
        items={[
          { name: 'SoFi Personal Loan', amount: 0, day: 6, creditor: 'SoFi', pastDue: 1530.64 },
          { name: 'Rent', amount: 1200, day: 1 },
        ]}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByText(/SoFi Personal Loan: \$0.00 \(day 6\) \(SoFi\) — past due \$1530.64/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rent: \$1200.00 \(day 1\)/)).toBeInTheDocument();
  });
});
