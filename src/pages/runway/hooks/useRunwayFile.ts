import { useCallback, useState } from 'react';
import { parseRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

interface IUseRunwayFileResult {
  data: IRunwayData | null;
  error: string | null;
  fileName: string | null;
  load: () => Promise<void>;
  setData: (data: IRunwayData) => void;
}

function useRunwayFile(): IUseRunwayFileResult {
  const [, setHandle] = useState<FileSystemFileHandle | null>(null);
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

  const setData = useCallback((next: IRunwayData) => {
    setDataState(next);
  }, []);

  return { data, error, fileName, load, setData };
}

export default useRunwayFile;
