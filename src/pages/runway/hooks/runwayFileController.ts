import { parseRunwayData, serializeRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

// About a second after a change, the file is written; outside edits are looked for this often.
export const SAVE_DELAY_MS = 1000;
export const POLL_INTERVAL_MS = 2000;

export type TSaveStatus =
  | { kind: 'saved'; at: Date | null }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }
  | { kind: 'updatedFromDisk'; at: Date }
  | { kind: 'readOnly' }
  | { kind: 'unreadable' };

export interface IFileControllerCallbacks {
  onData: (data: IRunwayData) => void;
  onStatus: (status: TSaveStatus) => void;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Asks for permission to write. A handle without the method (older APIs, test doubles) is
// treated as writable; a refusal or an error is not.
export async function requestWrite(handle: FileSystemFileHandle): Promise<boolean> {
  if (typeof handle.requestPermission !== 'function') {
    return true;
  }
  try {
    return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false;
  }
}

// Owns one open file: debounced saving, and outside edits that always win. It holds no React
// state of its own; it reports what to show through the callbacks.
export function createRunwayFileController(callbacks: IFileControllerCallbacks) {
  let handle: FileSystemFileHandle | null = null;
  let latest: IRunwayData | null = null;
  let lastModified = 0;
  let version = 0; // goes up on every change made on the page, and on every version loaded
  let savedVersion = 0; // the version the file on disk matches
  let timer: ReturnType<typeof setTimeout> | null = null;
  let writing = false;
  let canWrite = false;
  let readable = true; // false while the file's newest version cannot be parsed

  const hasUnsaved = () => version !== savedVersion;

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    cancelTimer();
    timer = setTimeout(() => {
      timer = null;
      void writeNow();
    }, SAVE_DELAY_MS);
  };

  // Shows a version read from disk: anything waiting to be saved is dropped, because the file
  // on disk wins.
  const show = (next: IRunwayData, modified: number) => {
    cancelTimer();
    latest = next;
    version += 1;
    savedVersion = version;
    lastModified = modified;
    readable = true;
    callbacks.onData(next);
  };

  const loadOutsideVersion = async (file: File) => {
    let parsed: IRunwayData;
    try {
      parsed = parseRunwayData(await file.text());
    } catch {
      readable = false;
      cancelTimer();
      callbacks.onStatus({ kind: 'unreadable' });
      return;
    }
    show(parsed, file.lastModified);
    callbacks.onStatus({ kind: 'updatedFromDisk', at: new Date() });
  };

  async function writeNow(): Promise<void> {
    cancelTimer();
    if (!handle || !latest || !canWrite || !readable || !hasUnsaved()) {
      return;
    }
    if (writing) {
      schedule(); // a write is already in flight; this change goes in the next one
      return;
    }
    writing = true;
    const writingVersion = version;
    const text = serializeRunwayData(latest);
    try {
      const before = await handle.getFile();
      if (before.lastModified !== lastModified) {
        await loadOutsideVersion(before);
        return;
      }
      const stream = await handle.createWritable();
      try {
        await stream.write(text);
        await stream.close();
      } catch (err) {
        await stream.abort().catch(() => {});
        throw err;
      }
      // An outside save can land right after this one; only text identical to what was written
      // counts as this page's own write.
      const after = await handle.getFile();
      if ((await after.text()) !== text) {
        await loadOutsideVersion(after);
        return;
      }
      lastModified = after.lastModified;
      if (version === writingVersion) {
        savedVersion = writingVersion;
        callbacks.onStatus({ kind: 'saved', at: new Date() });
      }
    } catch (err) {
      callbacks.onStatus({ kind: 'error', message: errorMessage(err) });
    } finally {
      writing = false;
    }
  }

  return {
    hasUnsaved,

    async opened(selected: FileSystemFileHandle, writable: boolean): Promise<string> {
      const file = await selected.getFile();
      const parsed = parseRunwayData(await file.text());
      handle = selected;
      canWrite = writable;
      show(parsed, file.lastModified);
      callbacks.onStatus(writable ? { kind: 'saved', at: null } : { kind: 'readOnly' });
      return file.name;
    },

    change(next: IRunwayData): void {
      latest = next;
      version += 1;
      callbacks.onData(next);
      if (!readable) {
        return; // the status already says the file can't be read
      }
      if (!canWrite) {
        callbacks.onStatus({ kind: 'readOnly' });
        return;
      }
      callbacks.onStatus({ kind: 'saving' });
      schedule();
    },

    writeNow,

    async checkForOutsideChange(): Promise<void> {
      if (!handle || writing) {
        return;
      }
      try {
        const file = await handle.getFile();
        if (file.lastModified !== lastModified) {
          await loadOutsideVersion(file);
        }
      } catch (err) {
        callbacks.onStatus({ kind: 'error', message: errorMessage(err) });
      }
    },

    async allow(): Promise<void> {
      if (!handle) {
        return;
      }
      canWrite = await requestWrite(handle);
      if (!canWrite) {
        callbacks.onStatus({ kind: 'readOnly' });
        return;
      }
      if (hasUnsaved()) {
        callbacks.onStatus({ kind: 'saving' });
        await writeNow();
      } else {
        callbacks.onStatus({ kind: 'saved', at: null });
      }
    },

    // Writes a waiting change right away, for when the page is about to be hidden.
    flush(): void {
      if (timer !== null) {
        cancelTimer();
        void writeNow();
      }
    },

    dispose: cancelTimer,
  };
}

export type TRunwayFileController = ReturnType<typeof createRunwayFileController>;
