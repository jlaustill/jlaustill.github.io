import { describe, expect, it, vi } from 'vitest';
import { calculateRunway } from './engine/runwayEngine';
import { liveShapedFile, saveWithoutEdits } from './testUtils/pageRoundTrip';

// The real engine, wrapped so its calls can be counted. A ten-year projection takes a
// noticeable fraction of a second, so a blur that changed nothing must not trigger one.
vi.mock('./engine/runwayEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/runwayEngine')>();
  return { ...actual, calculateRunway: vi.fn(actual.calculateRunway) };
});

describe('recalculating the runway', () => {
  it('happens once when a file opens, and not again for blurs that changed nothing', async () => {
    await saveWithoutEdits(JSON.stringify(liveShapedFile));

    expect(calculateRunway).toHaveBeenCalledTimes(1);
  }, 20_000);
});
