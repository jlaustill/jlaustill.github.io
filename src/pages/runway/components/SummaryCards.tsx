import type { ReactNode } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import type { Temporal } from '@js-temporal/polyfill';
import { CHECK_IN_DAYS, scheduleWindow } from '../engine/window';
import { formatShortDate, formatWholeMoney } from '../format';
import type { IRunwayResult } from '../types/IRunwayResult';

interface ISummaryCardsProps {
  result: IRunwayResult;
  accountCount: number;
  today: Temporal.PlainDate;
}

const SummaryCard = ({ label, value, children }: { label: string; value: string; children: ReactNode }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="overline" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5">{value}</Typography>
    {children}
  </Paper>
);

const Detail = ({ children }: { children: ReactNode }) => (
  <Typography variant="body2" color="text.secondary">
    {children}
  </Typography>
);

// The three numbers a check-in is for: what is in the bank, the tightest point coming up, and
// how long the money lasts.
const SummaryCards = ({ result, accountCount, today }: ISummaryCardsProps) => {
  const { lowest } = scheduleWindow(result, today, CHECK_IN_DAYS);
  const laterLowIsLower = result.lowestBalance.amount < lowest.amount;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <SummaryCard label="Cash now" value={formatWholeMoney(result.startingBalance)}>
          <Detail>{accountCount === 1 ? '1 account' : `${accountCount} accounts`}</Detail>
        </SummaryCard>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <SummaryCard label={`Lowest, next ${CHECK_IN_DAYS} days`} value={formatWholeMoney(lowest.amount)}>
          <Detail>{formatShortDate(lowest.date, today)}</Detail>
        </SummaryCard>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <SummaryCard
          label="Runway"
          value={result.runwayEndDate ? `Ends ${formatShortDate(result.runwayEndDate, today)}` : '10+ years'}
        >
          <Detail>{result.runwayEndDate ? `before ${result.stoppedAtName}` : 'No shortfall ahead'}</Detail>
          {laterLowIsLower && (
            <Detail>
              {`Lowest later: ${formatWholeMoney(result.lowestBalance.amount)} on ${formatShortDate(result.lowestBalance.date, today)}`}
            </Detail>
          )}
        </SummaryCard>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;
