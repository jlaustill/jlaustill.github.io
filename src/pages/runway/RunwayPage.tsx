import { Box, Button, Typography, Alert } from '@mui/material';
import useBrowserSide from '../../hooks/useBrowserSide';
import useRunwayFile from './hooks/useRunwayFile';
import RunwaySkeleton from './RunwaySkeleton';
import CashOnHandEditor from './components/CashOnHandEditor';
import ExpectedInflowsEditor from './components/ExpectedInflowsEditor';
import PaymentsEditor from './components/PaymentsEditor';
import DepositsEditor from './components/DepositsEditor';

const RunwayApp = () => {
  const { data, error, fileName, load, setData } = useRunwayFile();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Runway
      </Typography>
      <Button variant="contained" onClick={load}>
        Open runway.json
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {fileName && (
        <Typography sx={{ mt: 2 }}>
          Loaded: {fileName} ({data?.payments.length ?? 0} payments,{' '}
          {data?.deposits.length ?? 0} deposits)
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
          <DepositsEditor
            items={data.deposits}
            onChange={(deposits) => setData({ ...data, deposits })}
          />
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
