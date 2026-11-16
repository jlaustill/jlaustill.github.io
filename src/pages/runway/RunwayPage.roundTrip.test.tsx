import { describe, expect, it } from 'vitest';
import { liveShapedFile, saveWithoutEdits } from './testUtils/pageRoundTrip';

describe('saving through the runway page', () => {
  it('saves a file it was only tabbed through without changing anything', async () => {
    const saved = await saveWithoutEdits(JSON.stringify(liveShapedFile));
    expect(JSON.parse(saved)).toEqual(liveShapedFile);
    expect(saved.endsWith('\n')).toBe(true);
  }, 20_000);
});
