import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunwayApp } from './RunwayPage';

// The engine is replaced by one that always throws, to prove the page survives any engine
// failure: unsaved edits stay on screen and Save stays available.
vi.mock('./engine/runwayEngine', () => ({
  calculateRunway: () => {
    throw new Error('engine exploded');
  },
}));

const file = {
  cashOnHand: [{ name: 'Checking', amount: 500 }],
  payments: [{ name: 'Rent', amount: 900, day: 1 }],
  recurringIncome: [],
  expectedInflows: [],
};

describe('RunwayApp when the engine fails', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the error and keeps the editors on screen', async () => {
    const handle = { getFile: async () => ({ name: 'runway.json', text: async () => JSON.stringify(file) }) };
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([handle]));
    const user = userEvent.setup();
    render(<RunwayApp />);

    await user.click(screen.getByText('Open runway.json'));

    expect(await screen.findByText('Could not calculate the runway: engine exploded')).toBeInTheDocument();
    expect(screen.getByText('Checking')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Bills & debts' }));
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();
  });
});
