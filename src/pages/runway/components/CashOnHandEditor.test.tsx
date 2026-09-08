import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CashOnHandEditor from './CashOnHandEditor';

describe('CashOnHandEditor', () => {
  it('renders each account and the total', () => {
    render(
      <CashOnHandEditor
        items={[
          { name: 'Checking', amount: 83.32, institution: 'Wells Fargo' },
          { name: 'Venmo', amount: 112.99 },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Checking: \$83.32 \(Wells Fargo\)/)).toBeInTheDocument();
    expect(screen.getByText(/Venmo: \$112.99/)).toBeInTheDocument();
    expect(screen.getByText('Total: $196.31')).toBeInTheDocument();
  });
});
