import { useMemo } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { Temporal } from '@js-temporal/polyfill';
import useBrowserSide from '../../hooks/useBrowserSide';
import useRunwayFile from './hooks/useRunwayFile';
import RunwaySkeleton from './RunwaySkeleton';
import CashOnHandEditor from './components/CashOnHandEditor';
import ExpectedInflowsEditor from './components/ExpectedInflowsEditor';
import PaymentsEditor from './components/PaymentsEditor';
import RecurringIncomeEditor from './components/RecurringIncomeEditor';
import RunwaySchedule from './components/RunwaySchedule';
import RunwaySummary from './components/RunwaySummary';
import { calculateRunway } from './engine/runwayEngine';
import type { IRunwayData } from './types/IRunwayData';

export const RunwayApp = () => {
  const { data, error, fileName, canSave, load, save, setData } = useRunwayFile();
  const today = useMemo(() => Temporal.Now.plainDateISO(), []);

  // The engine runs during render, so a failure is caught here: an error on screen keeps the
  // editors and Save available instead of unmounting the page and losing unsaved edits.
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
  // is never the same object). Treating that as an edit would re-run a ten-year projection on
  // every Tab, so a list whose saved form would be identical is not an edit.
  const update = <K extends keyof IRunwayData>(key: K) => (next: IRunwayData[K]) => {
    if (!data || JSON.stringify(data[key]) === JSON.stringify(next)) return;
    setData({ ...data, [key]: next });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Runway
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={load}>
          Open runway.json
        </Button>
        <Button variant="outlined" onClick={save} disabled={!canSave}>
          Save
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {fileName && (
        <Typography sx={{ mt: 2 }}>
          Loaded: {fileName} ({data?.payments.length ?? 0} payments,{' '}
          {data?.recurringIncome.length ?? 0} income sources)
        </Typography>
      )}
      {data && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <CashOnHandEditor items={data.cashOnHand} onChange={update('cashOnHand')} />
          <RecurringIncomeEditor items={data.recurringIncome} onChange={update('recurringIncome')} />
          <ExpectedInflowsEditor items={data.expectedInflows} onChange={update('expectedInflows')} />
          <PaymentsEditor items={data.payments} onChange={update('payments')} />
          {calculation?.error && (
            <Alert severity="error">Could not calculate the runway: {calculation.error}</Alert>
          )}
          {result && <RunwaySummary result={result} />}
          {result && <RunwaySchedule result={result} today={today} />}
        </Box>
      )}
    </Box>
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
