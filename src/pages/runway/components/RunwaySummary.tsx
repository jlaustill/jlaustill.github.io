import { Box, List, ListItem, Typography } from '@mui/material';
import type { TDebtField } from '../engine/debt';
import type { IRunwayResult, TPayoffProjection } from '../types/IRunwayResult';

interface IRunwaySummaryProps {
  result: IRunwayResult;
}

const FIELD_LABELS: Record<TDebtField, string> = {
  balance: 'balance',
  interestRate: 'interest rate',
  escrow: 'escrow',
};

function describePayoff(projection: TPayoffProjection): string {
  switch (projection.status) {
    case 'paidOff':
      return `paid off ${projection.date.toString()}`;
    case 'neverPaysOff':
      return 'never at the current payment';
    case 'beyondHorizon':
      return 'beyond 10 years';
    case 'missingValues':
      return `needs ${projection.fields.map((field) => FIELD_LABELS[field]).join(', ')}`;
  }
}

const RunwaySummary = ({ result }: IRunwaySummaryProps) => {
  return (
    <Box>
      <Typography variant="h6">Summary</Typography>
      <Typography>
        {result.runwayEndDate
          ? `Runway ends ${result.runwayEndDate.toString()}, before ${result.stoppedAtName}`
          : 'Runway extends beyond 10 years'}
      </Typography>
      <Typography>
        {`Lowest balance: $${result.lowestBalance.amount.toFixed(2)} on ${result.lowestBalance.date.toString()}`}
      </Typography>
      {result.payoffs.length > 0 && (
        <>
          <Typography sx={{ mt: 1 }}>Debt payoff, if every payment is made</Typography>
          <List dense>
            {result.payoffs.map((payoff, index) => (
              <ListItem key={`${payoff.name}-${index}`}>{`${payoff.name}: ${describePayoff(payoff.projection)}`}</ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default RunwaySummary;
