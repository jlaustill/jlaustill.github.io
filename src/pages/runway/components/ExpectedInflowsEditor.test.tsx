import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpectedInflowsEditor from './ExpectedInflowsEditor';

describe('ExpectedInflowsEditor', () => {
  it('shows a date when set, and "no date yet" when null', () => {
    render(
      <ExpectedInflowsEditor
        items={[
          { name: 'Progressive refund', amount: 300, date: null },
          { name: 'Tax refund', amount: 450, date: '2026-04-15' },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Progressive refund: \$300.00 \(no date yet\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tax refund: \$450.00 \(2026-04-15\)/)).toBeInTheDocument();
  });
});
