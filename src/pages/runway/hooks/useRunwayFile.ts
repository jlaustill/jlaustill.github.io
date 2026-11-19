import { useCallback, useEffect, useState } from 'react';
import {
  createRunwayFileController,
  POLL_INTERVAL_MS,
  requestWrite,
  SAVE_DELAY_MS,
  type TSaveStatus,
} from './runwayFileController';
import type { IRunwayData } from '../types/IRunwayData';

export { POLL_INTERVAL_MS, SAVE_DELAY_MS };
export type { TSaveStatus };

interface IUseRunwayFileResult {
  data: IRunwayData | null;
  error: string | null;
  fileName: string | null;
  saveStatus: TSaveStatus | null; // null until a file is open
  open: () => Promise<void>;
  update: (next: IRunwayData) => void;
  retrySave: () => Promise<void>;
  allowSaving: () => Promise<void>;
  // True when edits on screen are not in the file and no save is coming for them.
  unsavedAtRisk: () => boolean;
}

const LEAVE_WITH_UNSAVED_EDITS = 'Some changes on this page are not saved. Leave anyway and lose them?';

// Chrome and Edge ship with the File System Access API on. Brave ships with it off behind a
// flag, so a Brave user is told exactly which setting to change.
function fileAccessUnavailableMessage(): string {
  if ('brave' in navigator) {
    return 'Brave has local file access turned off. Open brave://flags/#file-system-access-api, set it to Enabled, relaunch Brave, and try again.';
  }
  return 'This browser cannot open local files from a web page. Use Chrome or Edge, or Brave with brave://flags/#file-system-access-api enabled.';
}

function useRunwayFile(): IUseRunwayFileResult {
  const [data, setData] = useState<IRunwayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<TSaveStatus | null>(null);
  const [controller] = useState(() => createRunwayFileController({ onData: setData, onStatus: setSaveStatus }));

  // While a file is open: look for outside edits, write a waiting change before the tab hides,
  // and warn before leaving with a change that is not in the file yet.
  useEffect(() => {
    if (!fileName) {
      return undefined;
    }
    const poll = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        void controller.checkForOutsideChange();
      }
    }, POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        controller.flush();
      } else {
        void controller.checkForOutsideChange();
      }
    };
    const onFocus = () => {
      void controller.checkForOutsideChange();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // A field still being typed in is committed first: closing the tab does not blur it.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (controller.hasUnsaved()) {
        event.preventDefault();
      }
    };
    // A link inside the site swaps this page out with no beforeunload. A change waiting for its
    // delay is written on the way out (see dispose); edits that cannot be saved ask first.
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      const leavesPage =
        link instanceof HTMLAnchorElement &&
        link.target !== '_blank' &&
        link.pathname !== window.location.pathname &&
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;
      if (leavesPage && controller.unsavedAtRisk() && !window.confirm(LEAVE_WITH_UNSAVED_EDITS)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('click', onClick, true);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [controller, fileName]);

  useEffect(() => () => controller.dispose(), [controller]);

  const open = useCallback(async () => {
    setError(null);
    if (!('showOpenFilePicker' in window)) {
      setError(fileAccessUnavailableMessage());
      return;
    }
    // A change still waiting for its delay goes into the file that is open now. Opening the next
    // file waits its turn behind that write.
    void controller.flush();
    try {
      const [selected] = await window.showOpenFilePicker({
        types: [{ description: 'Runway JSON', accept: { 'application/json': ['.json'] } }],
      });
      // Asked now, inside the click: a save that fires on a timer cannot raise this prompt.
      const writable = await requestWrite(selected);
      setFileName(await controller.opened(selected, writable));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // the picker was cancelled, not an error
      }
      setError(err instanceof Error ? err.message : 'Failed to load the file.');
    }
  }, [controller]);

  const update = useCallback((next: IRunwayData) => controller.change(next), [controller]);
  const retrySave = useCallback(() => controller.writeNow(), [controller]);
  const allowSaving = useCallback(() => controller.allow(), [controller]);
  const unsavedAtRisk = useCallback(() => controller.unsavedAtRisk(), [controller]);

  return { data, error, fileName, saveStatus, open, update, retrySave, allowSaving, unsavedAtRisk };
}

export default useRunwayFile;
