import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateRunway } from './engine/runwayEngine';
import { liveShapedFile, openInPage, settle, visitEveryTabAndField } from './testUtils/pageRoundTrip';

// The real engine, wrapped so its calls can be counted. A ten-year projection takes a
// noticeable fraction of a second, so a visit that changed nothing must not trigger one.
vi.mock('./engine/runwayEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/runwayEngine')>();
  return { ...actual, calculateRunway: vi.fn(actual.calculateRunway) };
});

describe('recalculating the runway', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('happens once when a file opens, and not again for a visit that changed nothing', async () => {
    const { user } = await openInPage(JSON.stringify(liveShapedFile));

    await visitEveryTabAndField(user);
    await settle();

    expect(calculateRunway).toHaveBeenCalledTimes(1);
  }, 60_000);
});
