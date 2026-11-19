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

const linksAdded: { remove: () => void }[] = [];

// A link to another page of the site. jsdom cannot navigate, so a click that gets through to the
// page is recorded as followed and then stopped.
function addLink() {
  const link = document.body.appendChild(document.createElement('a'));
  link.href = '/blog';
  let followed = false;
  const follow = (event: Event) => {
    followed = !event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', follow);
  const added = {
    click() {
      followed = false;
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      return followed;
    },
    remove() {
      document.removeEventListener('click', follow);
      link.remove();
    },
  };
  linksAdded.push(added);
  return added;
}

describe('useRunwayFile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    linksAdded.splice(0).forEach((link) => link.remove());
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

  it('never writes over an outside edit that a check is still loading', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(500);
    file.editOutside(fileText(withChecking(500)));
    // A check reads the outside edit slowly. The save comes due meanwhile, and its own look at
    // the file answers only after the check has finished.
    const releaseCheckRead = file.holdNext('text');
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    const releaseSaveRead = file.holdNext('getFile');
    await advance(SAVE_DELAY_MS);
    releaseCheckRead();
    await advance(0);
    releaseSaveRead();
    await advance(5000);

    expect(file.writes).toHaveLength(0);
    expect(checkingIn(file.currentText())).toBe(500);
    expect(result.current.data).toEqual(withChecking(500));
  });

  it('does not take its own write for an outside edit when a check answers mid-write', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(500);
    // A check starts just before the save comes due, and its look at the file answers while the
    // save is finishing.
    const releaseCheck = file.holdNext('getFile');
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    file.onNextClose(() => releaseCheck());
    await advance(SAVE_DELAY_MS);
    releaseCheck();
    await advance(POLL_INTERVAL_MS);

    expect(file.writes.map(checkingIn)).toEqual([200]);
    expect(result.current.saveStatus?.kind).toBe('saved');
  });

  it('writes a waiting change when the page goes away before it is due', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result, unmount } = await openWith(file);

    act(() => result.current.update(withChecking(200)));
    await advance(300);
    unmount();
    await advance(SAVE_DELAY_MS * 3);

    expect(file.writes.map(checkingIn)).toEqual([200]);
  });

  it('asks before a link leaves the page with changes that cannot be saved', async () => {
    const file = createFakeFile(fileText(withChecking(100)), { permission: 'denied' });
    const { result } = await openWith(file);
    const link = addLink();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(link.click()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();

    act(() => result.current.update(withChecking(200)));
    expect(link.click()).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);

    confirm.mockReturnValue(true);
    expect(link.click()).toBe(true);
  });

  it('lets a link leave without asking when the waiting change will be saved on the way out', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);
    const link = addLink();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    act(() => result.current.update(withChecking(200)));

    expect(link.click()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('writes a waiting change to the open file before another file is opened', async () => {
    const file = createFakeFile(fileText(withChecking(100)));
    const { result } = await openWith(file);
    const other = createFakeFile(fileText(withChecking(700)));
    stubFilePicker(other);

    act(() => result.current.update(withChecking(200)));
    await act(async () => {
      await result.current.open();
    });
    await advance(SAVE_DELAY_MS * 3);

    expect(file.writes.map(checkingIn)).toEqual([200]);
    expect(other.writes).toHaveLength(0);
    expect(result.current.data).toEqual(withChecking(700));
  });
});
