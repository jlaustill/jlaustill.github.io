import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunwayApp } from './RunwayPage';

// jsdom has no File System Access API, which is exactly the situation in Brave with its default
// settings and in browsers that do not support the API at all.
describe('opening a file in a browser without local file access', () => {
  afterEach(() => {
    delete (navigator as Navigator & { brave?: unknown }).brave;
  });

  it('tells a Brave user which setting turns local file access on', async () => {
    Object.defineProperty(navigator, 'brave', { value: { isBrave: async () => true }, configurable: true });
    const user = userEvent.setup();
    render(<RunwayApp />);

    await user.click(screen.getByText('Open runway.json'));

    expect(screen.getByRole('alert')).toHaveTextContent('brave://flags/#file-system-access-api');
  });

  it('points other browsers to Chrome or Edge, without claiming Brave works as it ships', async () => {
    const user = userEvent.setup();
    render(<RunwayApp />);

    await user.click(screen.getByText('Open runway.json'));

    const message = screen.getByRole('alert').textContent ?? '';
    expect(message).toContain('Chrome or Edge');
    expect(message).not.toContain('(Chrome, Edge, or Brave)');
  });
});
