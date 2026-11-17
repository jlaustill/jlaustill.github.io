import { useState } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Temporal } from '@js-temporal/polyfill';
import { roundToCents } from '../engine/money';
import type { IRunwayResult } from '../types/IRunwayResult';

interface IRunwayScheduleProps {
  result: IRunwayResult;
  today: Temporal.PlainDate;
}

// Ten years of paydays and bills is thousands of rows; the next three months is what gets acted on.
const WINDOW_DAYS = 90;

const RunwaySchedule = ({ result, today }: IRunwayScheduleProps) => {
  const [showAll, setShowAll] = useState(false);
  const windowEnd = today.add({ days: WINDOW_DAYS });

  // The running balance is computed over every row, so hiding later rows never changes it.
  let runningBalance = result.startingBalance;
  const rows = result.scheduled.map((transaction) => {
    runningBalance = roundToCents(runningBalance + transaction.amount);
    return { transaction, balance: runningBalance };
  });
  const inWindow = rows.filter((row) => Temporal.PlainDate.compare(row.transaction.date, windowEnd) <= 0);
  const laterCount = rows.length - inWindow.length;
  const visible = showAll ? rows : inWindow;

  return (
    <Box>
      <Typography variant="h6">Projected Schedule</Typography>
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
          {visible.map(({ transaction, balance }, index) => (
            <TableRow key={`${transaction.date.toString()}-${index}`}>
              <TableCell>{transaction.date.toString()}</TableCell>
              <TableCell>{transaction.name}</TableCell>
              <TableCell align="right">{transaction.amount.toFixed(2)}</TableCell>
              <TableCell align="right">{balance.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {laterCount > 0 && (
        <Button sx={{ mt: 1 }} onClick={() => setShowAll(!showAll)}>
          {showAll ? `Show next ${WINDOW_DAYS} days` : `Show all (${laterCount} more)`}
        </Button>
      )}
    </Box>
  );
};

export default RunwaySchedule;
