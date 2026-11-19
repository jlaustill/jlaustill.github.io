import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Temporal } from '@js-temporal/polyfill';
import { CHECK_IN_DAYS, scheduleWindow, withRunningBalance, type IWindowRow } from '../engine/window';
import { formatLongDate, formatMoney, formatShortDate, formatSignedMoney } from '../format';
import type { IRunwayResult } from '../types/IRunwayResult';

interface INextDaysCardProps {
  result: IRunwayResult;
  today: Temporal.PlainDate;
}

const NextDaysCard = ({ result, today }: INextDaysCardProps) => {
  const [showAll, setShowAll] = useState(false);
  const checkIn = scheduleWindow(result, today, CHECK_IN_DAYS);
  const allRows = withRunningBalance(result);
  const laterCount = allRows.length - checkIn.rows.length;
  const rows: IWindowRow[] = showAll ? allRows : checkIn.rows;
  const isLow = (row: IWindowRow) =>
    row.balance === checkIn.lowest.amount && row.transaction.date.equals(checkIn.lowest.date);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {showAll ? 'Full schedule' : `Next ${CHECK_IN_DAYS} days`}
      </Typography>
      <TableContainer sx={{ maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const low = isLow(row);
              const { amount } = row.transaction;
              return (
                <TableRow
                  key={`${row.transaction.date.toString()}-${index}`}
                  sx={low ? { backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.12) } : undefined}
                >
                  <TableCell>{formatShortDate(row.transaction.date, today)}</TableCell>
                  <TableCell>{row.transaction.name}</TableCell>
                  <TableCell align="right" sx={{ color: amount > 0 ? 'success.main' : 'error.main' }}>
                    {formatSignedMoney(amount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(row.balance)}
                    {low && <Chip size="small" color="warning" variant="outlined" label="low" sx={{ ml: 1 }} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {checkIn.endsInWindow && result.runwayEndDate && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {`Runway ends ${formatLongDate(result.runwayEndDate)}, before ${result.stoppedAtName}`}
        </Typography>
      )}
      {laterCount > 0 && (
        <Box sx={{ mt: 1 }}>
          <Button size="small" onClick={() => setShowAll(!showAll)}>
            {showAll ? `Show next ${CHECK_IN_DAYS} days` : `Show all (${laterCount} more)`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default NextDaysCard;
