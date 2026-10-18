import { Box, Typography, CircularProgress } from '@mui/material';

const RunwaySkeleton = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
      <Typography variant="h4">Runway</Typography>
      <CircularProgress />
    </Box>
  );
};

export default RunwaySkeleton;
