import { vi } from 'vitest';

// An in-memory stand-in for a File System Access handle: it records every write, can be edited
// "outside the page", can refuse a write, and can grant or deny read-write permission.
export interface IFakeFile {
  handle: FileSystemFileHandle;
  writes: string[];
  currentText(): string;
  editOutside(text: string): void;
  failNextWrite(): void;
  setPermission(state: PermissionState): void;
  onNextClose(callback: () => void): void;
  // Makes the next read of this kind wait until the returned function is called, so a test can
  // choose the order in which overlapping file operations finish. The read answers with the file
  // as it is when released.
  holdNext(kind: TRead): () => void;
}

type TRead = 'getFile' | 'text';

export function createFakeFile(text: string, options: { permission?: PermissionState } = {}): IFakeFile {
  let contents = text;
  let lastModified = 1000;
  let permission: PermissionState = options.permission ?? 'granted';
  let failNext = false;
  let afterClose: (() => void) | null = null;
  const writes: string[] = [];
  const holds: Record<TRead, Promise<void>[]> = { getFile: [], text: [] };
  const waitIfHeld = async (kind: TRead) => {
    const hold = holds[kind].shift();
    if (hold) {
      await hold;
    }
  };

  const handle = {
    kind: 'file',
    name: 'runway.json',
    getFile: async () => {
      await waitIfHeld('getFile');
      return {
        name: 'runway.json',
        lastModified,
        text: async () => {
          await waitIfHeld('text');
          return contents;
        },
      };
    },
    queryPermission: async () => permission,
    requestPermission: async () => permission,
    createWritable: async () => {
      let pending = '';
      return {
        write: async (data: string) => {
          if (failNext) {
            failNext = false;
            throw new Error('The disk is full');
          }
          pending = data;
        },
        close: async () => {
          contents = pending;
          lastModified += 1;
          writes.push(pending);
          const callback = afterClose;
          afterClose = null;
          callback?.();
        },
        abort: async () => {},
      };
    },
  } as unknown as FileSystemFileHandle;

  return {
    handle,
    writes,
    currentText: () => contents,
    editOutside: (next) => {
      contents = next;
      lastModified += 1;
    },
    failNextWrite: () => {
      failNext = true;
    },
    setPermission: (state) => {
      permission = state;
    },
    onNextClose: (callback) => {
      afterClose = callback;
    },
    holdNext: (kind) => {
      let release = () => {};
      holds[kind].push(
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      );
      return () => release();
    },
  };
}

export function stubFilePicker(file: IFakeFile): void {
  vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([file.handle]));
}
