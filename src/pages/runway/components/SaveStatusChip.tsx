import type { ReactElement } from 'react';
import { Box, Button, Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import EditOffIcon from '@mui/icons-material/EditOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { formatClockTime } from '../format';
import type { TSaveStatus } from '../hooks/useRunwayFile';

interface ISaveStatusChipProps {
  status: TSaveStatus;
  onRetry: () => void;
  onAllow: () => void;
}

type TChipColor = 'success' | 'info' | 'error' | 'warning';

function describe(status: TSaveStatus): { label: string; color: TChipColor; icon: ReactElement; title?: string } {
  switch (status.kind) {
    case 'saved':
      return {
        label: status.at ? `Saved ${formatClockTime(status.at)}` : 'Saved',
        color: 'success',
        icon: <CheckCircleOutlineIcon />,
      };
    case 'saving':
      return { label: 'Saving…', color: 'info', icon: <SyncIcon /> };
    case 'error':
      return { label: "Couldn't save", color: 'error', icon: <ErrorOutlineIcon />, title: status.message };
    case 'updatedFromDisk':
      return { label: `Updated from disk ${formatClockTime(status.at)}`, color: 'info', icon: <DownloadDoneIcon /> };
    case 'readOnly':
      return { label: 'Saving is off', color: 'warning', icon: <EditOffIcon /> };
    case 'unreadable':
      return { label: "Can't read the file's new version", color: 'warning', icon: <WarningAmberIcon /> };
  }
}

// Says whether everything on screen is in the file. role="status" makes screen readers announce
// each change without moving focus.
const SaveStatusChip = ({ status, onRetry, onAllow }: ISaveStatusChipProps) => {
  const { label, color, icon, title } = describe(status);
  return (
    <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip size="small" variant="outlined" color={color} icon={icon} label={label} title={title} />
      {status.kind === 'error' && (
        <Button size="small" onClick={onRetry}>
          Retry
        </Button>
      )}
      {status.kind === 'readOnly' && (
        <Button size="small" onClick={onAllow}>
          Allow
        </Button>
      )}
    </Box>
  );
};

export default SaveStatusChip;
