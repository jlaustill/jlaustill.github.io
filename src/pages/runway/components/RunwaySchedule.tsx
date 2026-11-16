import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { IRunwayResult } from '../types/IRunwayResult';

interface IRunwayScheduleProps {
  result: IRunwayResult;
}

const RunwaySchedule = ({ result }: IRunwayScheduleProps) => {
  let runningBalance = result.startingBalance;

  return (
    <Box>
      <Typography variant="h6">Projected Schedule</Typography>
      <Typography sx={{ mb: 1 }}>
        {result.runwayEndDate
          ? `Runway ends ${result.runwayEndDate.toString()}, before ${result.stoppedAtName}`
          : 'Runway extends beyond the projection window'}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {result.scheduled.map((transaction, index) => {
            runningBalance += transaction.amount;
            return (
              <TableRow key={`${transaction.date.toString()}-${index}`}>
                <TableCell>{transaction.date.toString()}</TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell align="right">{transaction.amount.toFixed(2)}</TableCell>
                <TableCell align="right">{runningBalance.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

export default RunwaySchedule;
