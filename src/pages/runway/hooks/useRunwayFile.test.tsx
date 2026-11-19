import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useRunwayFile, { POLL_INTERVAL_MS, SAVE_DELAY_MS } from './useRunwayFile';
import { createFakeFile, stubFilePicker, type IFakeFile } from '../testUtils/fakeFileHandle';
import type { IRunwayData } from '../types/IRunwayData';

const withChecking = (amount: number): IRunwayData => ({
  cashOnHand: [{ name: 'Checking', amount }],
  payments: [],
  recurringIncome: [],
  expectedInflows: [],
});
const fileText = (data: IRunwayData) => `${JSON.stringify(data, null, 2)}\n`;
const checkingIn = (text: string) => JSON.parse(text).cashOnHand[0].amount;

async function openWith(file: IFakeFile) {
  stubFilePicker(file);
  const hook = renderHook(() => useRunwayFile());
  await act(async () => {
    await hook.result.current.open();
  });
  return hook;
}

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('useRunwayFile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens the file, shows its data, and starts out saved', async () => {
    const { result } = await openWith(createFakeFile(fileText(withChecking(100))));

    expect(result.current.data).toEqual(withChecking(100));
    expect(result.current.fileName).toBe('runway.json');
    expect(result.current.saveStatus).toEqual({ kind: 'saved', at: null });
  });

  it('writes a change once, a second after it is made', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(SAVE_DELAY_MS - 1);
    expect(file.writes).toHaveLength(0);
    expect(result.current.saveStatus).toEqual({ kind: 'saving' });

    await advance(1);
    expect(file.writes).toEqual([fileText(withChecking(200))]);
    expect(result.current.saveStatus?.kind).toBe('saved');
  });

  it('writes a burst of changes once, with the latest one', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(500);
    act(() => result.current.update(withChecking(300)));
    await advance(SAVE_DELAY_MS - 1);
    expect(file.writes).toHaveLength(0);

    await advance(1);
    expect(file.writes.map(checkingIn)).toEqual([300]);
  });

  it('writes a change made during a write in the next write, without losing it', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    file.onNextClose(() => result.current.update(withChecking(300)));
    act(() => result.current.update(withChecking(200)));
    await advance(SAVE_DELAY_MS);
    expect(file.writes.map(checkingIn)).toEqual([200]);
    expect(result.current.saveStatus).toEqual({ kind: 'saving' });

    await advance(SAVE_DELAY_MS);
    expect(file.writes.map(checkingIn)).toEqual([200, 300]);
    expect(result.current.saveStatus?.kind).toBe('saved');
  });

  it('never writes when nothing changes', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    await openWith(file);

    await advance(10_000);

    expect(file.writes).toHaveLength(0);
  });

  it('says a failed write failed, and saves on retry', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    file.failNextWrite();
    act(() => result.current.update(withChecking(200)));
    await advance(SAVE_DELAY_MS);
    expect(result.current.saveStatus?.kind).toBe('error');
    expect(file.writes).toHaveLength(0);

    await act(async () => {
      await result.current.retrySave();
    });
    expect(file.writes.map(checkingIn)).toEqual([200]);
    expect(result.current.saveStatus?.kind).toBe('saved');
  });

  it('keeps edits on screen while saving is not allowed, and saves them once it is', async () => {
    const file = createFakeFile(fileText(withChecking(100)), { permission: 'denied' });
    const { result } = await openWith(file);
    expect(result.current.saveStatus).toEqual({ kind: 'readOnly' });

    act(() => result.current.update(withChecking(200)));
    await advance(5000);
    expect(file.writes).toHaveLength(0);
    expect(result.current.data).toEqual(withChecking(200));

    const leaving = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leaving);
    expect(leaving.defaultPrevented).toBe(true);

    file.setPermission('granted');
    await act(async () => {
      await result.current.allowSaving();
    });
    expect(file.writes.map(checkingIn)).toEqual([200]);
    expect(result.current.saveStatus?.kind).toBe('saved');
  });

  it('loads an outside edit within one poll', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    file.editOutside(fileText(withChecking(500)));
    await advance(POLL_INTERVAL_MS);

    expect(result.current.data).toEqual(withChecking(500));
    expect(result.current.saveStatus?.kind).toBe('updatedFromDisk');
  });

  it('lets an outside edit win over a change that has not been written yet', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(500);
    file.editOutside(fileText(withChecking(500)));
    await advance(5000);

    expect(file.writes).toHaveLength(0);
    expect(checkingIn(file.currentText())).toBe(500);
    expect(result.current.data).toEqual(withChecking(500));
  });

  it('does not mistake its own write for an outside edit', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(SAVE_DELAY_MS);
    await advance(POLL_INTERVAL_MS * 2);

    expect(result.current.saveStatus?.kind).toBe('saved');
    expect(result.current.data).toEqual(withChecking(200));
  });

  it('loads an outside edit that lands right after its own write', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    file.onNextClose(() => file.editOutside(fileText(withChecking(900))));
    act(() => result.current.update(withChecking(200)));
    await advance(SAVE_DELAY_MS);

    expect(result.current.data).toEqual(withChecking(900));
    expect(result.current.saveStatus?.kind).toBe('updatedFromDisk');
  });

  it('stops saving while the file cannot be read, and loads the next readable version', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    file.editOutside('{ "cashOnHand": [');
    await advance(POLL_INTERVAL_MS);
    expect(result.current.saveStatus).toEqual({ kind: 'unreadable' });
    expect(result.current.data).toEqual(withChecking(100));

    act(() => result.current.update(withChecking(200)));
    await advance(SAVE_DELAY_MS * 3);
    expect(file.writes).toHaveLength(0);

    file.editOutside(fileText(withChecking(700)));
    await advance(POLL_INTERVAL_MS);
    expect(result.current.data).toEqual(withChecking(700));
    expect(result.current.saveStatus?.kind).toBe('updatedFromDisk');
  });

  it('writes a pending change at once when the tab is hidden', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
    });
    visibility.mockRestore();

    expect(file.writes.map(checkingIn)).toEqual([200]);
  });
});
