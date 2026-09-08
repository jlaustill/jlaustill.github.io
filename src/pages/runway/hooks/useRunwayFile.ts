import { useCallback, useState } from 'react';
import { parseRunwayData, serializeRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

interface IUseRunwayFileResult {
  data: IRunwayData | null;
  error: string | null;
  fileName: string | null;
  canSave: boolean;
  load: () => Promise<void>;
  save: () => Promise<void>;
  setData: (data: IRunwayData) => void;
}

function useRunwayFile(): IUseRunwayFileResult {
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [data, setDataState] = useState<IRunwayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    if (!('showOpenFilePicker' in window)) {
      setError('This tool needs a Chromium browser (Chrome, Edge, or Brave) to open local files.');
      return;
    }
    try {
      const [selectedHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Runway JSON', accept: { 'application/json': ['.json'] } }],
      });
      const file = await selectedHandle.getFile();
      const text = await file.text();
      const parsed = parseRunwayData(text);
      setHandle(selectedHandle);
      setDataState(parsed);
      setFileName(file.name);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // user cancelled the picker, not an error
      }
      setError(err instanceof Error ? err.message : 'Failed to load the file.');
    }
  }, []);

  const save = useCallback(async () => {
    if (!handle || !data) return;
    setError(null);
    let writable: FileSystemWritableFileStream | undefined;
    try {
      writable = await handle.createWritable();
      await writable.write(serializeRunwayData(data));
      await writable.close();
    } catch (err) {
      // If write() rejects after createWritable() already succeeded, the
      // stream is left neither closed nor aborted -- it still holds a write
      // lock on the handle, which can make the NEXT save() on this same
      // handle fail with an unrelated "already has an active writer" error.
      // Abort it here so a failed save doesn't silently break the retry.
      await writable?.abort().catch(() => {});
      setError(
        err instanceof Error
          ? `Could not save: ${err.message}. Try opening the file again.`
          : 'Could not save the file.',
      );
    }
  }, [handle, data]);

  const setData = useCallback((next: IRunwayData) => {
    setDataState(next);
  }, []);

  return { data, error, fileName, canSave: handle !== null, load, save, setData };
}

export default useRunwayFile;
