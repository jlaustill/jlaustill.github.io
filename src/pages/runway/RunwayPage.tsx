import { useMemo } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { Temporal } from '@js-temporal/polyfill';
import useBrowserSide from '../../hooks/useBrowserSide';
import useRunwayFile from './hooks/useRunwayFile';
import RunwaySkeleton from './RunwaySkeleton';
import CashOnHandEditor from './components/CashOnHandEditor';
import ExpectedInflowsEditor from './components/ExpectedInflowsEditor';
import PaymentsEditor from './components/PaymentsEditor';
import RunwaySchedule from './components/RunwaySchedule';
import { calculateRunway } from './engine/runwayEngine';

export const RunwayApp = () => {
  const { data, error, fileName, canSave, load, save, setData } = useRunwayFile();
  const today = useMemo(() => Temporal.Now.plainDateISO(), []);

  const result = useMemo(() => {
    if (!data) return null;
    return calculateRunway(data, today);
  }, [data, today]);

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
          <CashOnHandEditor
            items={data.cashOnHand}
            onChange={(cashOnHand) => setData({ ...data, cashOnHand })}
          />
          <ExpectedInflowsEditor
            items={data.expectedInflows}
            onChange={(expectedInflows) => setData({ ...data, expectedInflows })}
          />
          <PaymentsEditor
            items={data.payments}
            onChange={(payments) => setData({ ...data, payments })}
          />
          {result && <RunwaySchedule result={result} />}
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
