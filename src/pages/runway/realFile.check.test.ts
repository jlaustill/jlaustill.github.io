import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { calculateRunway } from './engine/runwayEngine';
import { parseRunwayData } from './hooks/runwayFileIO';
import { saveWithoutEdits } from './testUtils/pageRoundTrip';

// Local only, never in CI. Reads the real data file in place (its path comes from RUNWAY_FILE)
// and proves the page can open it, calculate it, and save it back without changing anything.
// Nothing is written to disk and nothing is copied into this repo.
const realFilePath = process.env.RUNWAY_FILE;

describe.skipIf(!realFilePath)('the real runway file (local only)', () => {
  it('opens, calculates, and survives a no-edit save through the page', async () => {
    const text = readFileSync(realFilePath ?? '', 'utf8');

    const result = calculateRunway(parseRunwayData(text), Temporal.Now.plainDateISO());
    expect(typeof result.startingBalance).toBe('number');
    expect(Number.isFinite(result.lowestBalance.amount)).toBe(true);

    const saved = await saveWithoutEdits(text);
    expect(JSON.parse(saved)).toEqual(JSON.parse(text));
  }, 180_000);
});
