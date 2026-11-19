import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import useBrowserSide from '../../hooks/useBrowserSide';
import useRunwayFile from './hooks/useRunwayFile';
import useToday from './hooks/useToday';
import RunwaySkeleton from './RunwaySkeleton';
import BalancesCard from './components/BalancesCard';
import ExpectedInflowsEditor from './components/ExpectedInflowsEditor';
import NextDaysCard from './components/NextDaysCard';
import PaymentsEditor from './components/PaymentsEditor';
import PayoffList from './components/PayoffList';
import RecurringIncomeEditor from './components/RecurringIncomeEditor';
import SaveStatusChip from './components/SaveStatusChip';
import SummaryCards from './components/SummaryCards';
import { calculateRunway } from './engine/runwayEngine';
import type { IRunwayData } from './types/IRunwayData';

type TTab = 'checkIn' | 'income' | 'bills' | 'payoff';

const TABS: { value: TTab; label: string }[] = [
  { value: 'checkIn', label: 'Check-in' },
  { value: 'income', label: 'Income' },
  { value: 'bills', label: 'Bills & debts' },
  { value: 'payoff', label: 'Payoff' },
];

export const RunwayApp = () => {
  const {
    data,
    error,
    fileName,
    saveStatus,
    open,
    update: updateData,
    retrySave,
    allowSaving,
    unsavedAtRisk,
  } = useRunwayFile();
  const today = useToday();
  const [tab, setTab] = useState<TTab>('checkIn');
  const [confirmingOpen, setConfirmingOpen] = useState(false);

  // Opening a file replaces what is on screen, so edits that cannot be saved are only thrown
  // away once the owner says so.
  const openAnotherFile = () => {
    if (unsavedAtRisk()) {
      setConfirmingOpen(true);
    } else {
      void open();
    }
  };

  // The engine runs during render, so a failure is caught here: an error on screen keeps the
  // editors available instead of unmounting the page and losing unsaved edits.
  const calculation = useMemo(() => {
    if (!data) return null;
    try {
      return { result: calculateRunway(data, today), error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : String(err) };
    }
  }, [data, today]);
  const result = calculation?.result ?? null;

  // A blur that changed nothing hands back an equal list (Formik keeps its own deep copy, so it
  // is never the same object). Treating that as an edit would re-run a ten-year projection, and
  // save, on every Tab, so a list whose saved form would be identical is not an edit.
  const update = <K extends keyof IRunwayData>(key: K) => (next: IRunwayData[K]) => {
    if (!data || JSON.stringify(data[key]) === JSON.stringify(next)) return;
    updateData({ ...data, [key]: next });
  };

  if (!data) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Runway
        </Typography>
        <Paper sx={{ p: 3, maxWidth: 560 }}>
          <Typography sx={{ mb: 2 }}>
            Open your runway.json to update balances and see the next two months. The file stays on this computer, and
            changes save themselves.
          </Typography>
          <Button variant="contained" startIcon={<FolderOpenIcon />} onClick={open}>
            Open runway.json
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1">
          Runway
        </Typography>
        {fileName && <Chip size="small" label={fileName} />}
        <Tooltip title="Open a different file">
          <IconButton aria-label="Open a different file" onClick={openAnotherFile}>
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        {saveStatus && <SaveStatusChip status={saveStatus} onRetry={retrySave} onAllow={allowSaving} />}
      </Box>
      <Dialog open={confirmingOpen} onClose={() => setConfirmingOpen(false)}>
        <DialogTitle>Discard changes that are not saved?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Some changes on this page are not in the file yet. Opening a file replaces them with what that file holds.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setConfirmingOpen(false);
              void open();
            }}
          >
            Discard and open
          </Button>
        </DialogActions>
      </Dialog>

      {error && <Alert severity="error">{error}</Alert>}
      {calculation?.error && <Alert severity="error">Could not calculate the runway: {calculation.error}</Alert>}
      {result && <SummaryCards result={result} accountCount={data.cashOnHand.length} today={today} />}

      <Box>
        <Tabs value={tab} onChange={(_event, next: TTab) => setTab(next)} aria-label="Runway sections">
          {TABS.map(({ value, label }) => (
            <Tab key={value} value={value} label={label} id={`runway-tab-${value}`} aria-controls="runway-panel" />
          ))}
        </Tabs>
        <Box id="runway-panel" role="tabpanel" aria-labelledby={`runway-tab-${tab}`} sx={{ pt: 2 }}>
          {tab === 'checkIn' && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <BalancesCard items={data.cashOnHand} onChange={update('cashOnHand')} today={today} />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>{result && <NextDaysCard result={result} today={today} />}</Grid>
            </Grid>
          )}
          {tab === 'income' && (
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <RecurringIncomeEditor items={data.recurringIncome} onChange={update('recurringIncome')} />
              </Paper>
              <Paper sx={{ p: 2 }}>
                <ExpectedInflowsEditor items={data.expectedInflows} onChange={update('expectedInflows')} />
              </Paper>
            </Stack>
          )}
          {tab === 'bills' && (
            <Paper sx={{ p: 2 }}>
              <PaymentsEditor items={data.payments} onChange={update('payments')} />
            </Paper>
          )}
          {tab === 'payoff' && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Debt payoff</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                When each debt is paid off, if every payment is made on time.
              </Typography>
              {result ? (
                <PayoffList payoffs={result.payoffs} />
              ) : (
                <Typography color="text.secondary">Payoff dates appear once the runway can be calculated.</Typography>
              )}
            </Paper>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

const RunwayPage = () => {
  const isBrowserSide = useBrowserSide();
  if (!isBrowserSide) {
    return <RunwaySkeleton />;
  }
  return <RunwayApp />;
};

export default RunwayPage;
