import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveStatusChip from './SaveStatusChip';
import type { TSaveStatus } from '../hooks/useRunwayFile';

const noop = () => {};

describe('SaveStatusChip', () => {
  it.each<[TSaveStatus, string]>([
    [{ kind: 'saved', at: null }, 'Saved'],
    [{ kind: 'saved', at: new Date(2026, 10, 19, 7, 2) }, 'Saved 7:02 AM'],
    [{ kind: 'saving' }, 'Saving…'],
    [{ kind: 'error', message: 'The disk is full' }, "Couldn't save"],
    [{ kind: 'updatedFromDisk', at: new Date(2026, 10, 19, 7, 5) }, 'Updated from disk 7:05 AM'],
    [{ kind: 'readOnly' }, 'Saving is off'],
    [{ kind: 'unreadable' }, "Can't read the file's new version"],
  ])('announces %j as "%s"', (status, text) => {
    render(<SaveStatusChip status={status} onRetry={noop} onAllow={noop} />);

    expect(screen.getByRole('status')).toHaveTextContent(text);
  });

  it('offers Retry after a failed save', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<SaveStatusChip status={{ kind: 'error', message: 'The disk is full' }} onRetry={onRetry} onAllow={noop} />);

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offers Allow while saving is off', async () => {
    const onAllow = vi.fn();
    const user = userEvent.setup();
    render(<SaveStatusChip status={{ kind: 'readOnly' }} onRetry={noop} onAllow={onAllow} />);

    await user.click(screen.getByRole('button', { name: 'Allow' }));

    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it('offers no action when everything is saved', () => {
    render(<SaveStatusChip status={{ kind: 'saved', at: null }} onRetry={noop} onAllow={noop} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
