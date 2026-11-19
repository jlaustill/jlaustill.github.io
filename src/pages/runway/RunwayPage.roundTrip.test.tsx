import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import { SAVE_DELAY_MS } from './hooks/useRunwayFile';
import { liveShapedFile, openInPage, settle, visitEveryTabAndField } from './testUtils/pageRoundTrip';

const fileText = `${JSON.stringify(liveShapedFile, null, 2)}\n`;

describe('saving through the runway page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('writes nothing when every tab and field is visited without an edit', async () => {
    const { user, file } = await openInPage(fileText);

    await visitEveryTabAndField(user);
    await settle();

    expect(file.writes).toEqual([]);
  }, 60_000);

  it('writes one changed balance once, changing nothing else but its date', async () => {
    const { user, file } = await openInPage(fileText);

    const field = within(screen.getAllByRole('listitem')[0]).getByLabelText('Balance');
    await user.clear(field);
    await user.type(field, '1,300');
    await user.tab();
    await settle(SAVE_DELAY_MS);

    expect(file.writes).toHaveLength(1);
    const expected = JSON.parse(fileText);
    expected.cashOnHand[0] = {
      ...expected.cashOnHand[0],
      amount: 1300,
      updatedAt: Temporal.Now.plainDateISO().toString(),
    };
    expect(JSON.parse(file.writes[0])).toEqual(expected);
    expect(file.writes[0].endsWith('\n')).toBe(true);
  }, 60_000);

  it('keeps an edit made just before switching tabs', async () => {
    const { user, file } = await openInPage(fileText);

    await user.click(screen.getByRole('tab', { name: 'Income' }));
    await user.type(screen.getByDisplayValue('Salary'), ' 2');
    await user.click(screen.getByRole('tab', { name: 'Payoff' }));
    await settle(SAVE_DELAY_MS);

    expect(file.writes).toHaveLength(1);
    expect(JSON.parse(file.writes[0]).recurringIncome[0].name).toBe('Salary 2');
  }, 60_000);
});
