import { Box, Button, Typography, Alert } from '@mui/material';
import useBrowserSide from '../../hooks/useBrowserSide';
import useRunwayFile from './hooks/useRunwayFile';
import RunwaySkeleton from './RunwaySkeleton';

const RunwayApp = () => {
  const { data, error, fileName, load } = useRunwayFile();

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
