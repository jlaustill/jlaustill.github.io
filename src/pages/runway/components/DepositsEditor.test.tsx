import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DepositsEditor from './DepositsEditor';

describe('DepositsEditor', () => {
  it('renders name, amount, and frequency', () => {
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Paycheck: \$1500.00 \(monthly, day 25\)/)).toBeInTheDocument();
  });
});
