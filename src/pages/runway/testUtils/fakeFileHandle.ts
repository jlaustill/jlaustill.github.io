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
}

export function createFakeFile(text: string, options: { permission?: PermissionState } = {}): IFakeFile {
  let contents = text;
  let lastModified = 1000;
  let permission: PermissionState = options.permission ?? 'granted';
  let failNext = false;
  let afterClose: (() => void) | null = null;
  const writes: string[] = [];

  const handle = {
    kind: 'file',
    name: 'runway.json',
    getFile: async () => ({ name: 'runway.json', lastModified, text: async () => contents }),
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
  };
}

export function stubFilePicker(file: IFakeFile): void {
  vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([file.handle]));
}
