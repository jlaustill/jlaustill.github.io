import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { calculateRunway } from './engine/runwayEngine';
import { parseRunwayData } from './hooks/runwayFileIO';
import { openInPage, settle, visitEveryTabAndField } from './testUtils/pageRoundTrip';

// Local only, never in CI. Reads the real data file in place (its path comes from RUNWAY_FILE)
// and proves the page can open and calculate it, and that visiting every tab and field without
// an edit writes nothing. The page writes to a fake file here, never to the real one.
const realFilePath = process.env.RUNWAY_FILE;

describe.skipIf(!realFilePath)('the real runway file (local only)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens, calculates, and writes nothing when visited without an edit', async () => {
    const text = readFileSync(realFilePath ?? '', 'utf8');

    const result = calculateRunway(parseRunwayData(text), Temporal.Now.plainDateISO());
    expect(typeof result.startingBalance).toBe('number');
    expect(Number.isFinite(result.lowestBalance.amount)).toBe(true);

    const { user, file } = await openInPage(text);
    await visitEveryTabAndField(user);
    await settle();
    expect(file.writes).toEqual([]);
  }, 180_000);
});
