import { Chip, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { TDebtField } from '../engine/debt';
import { formatLongDate } from '../format';
import type { IDebtPayoff, TPayoffProjection } from '../types/IRunwayResult';

interface IPayoffListProps {
  payoffs: IDebtPayoff[];
}

const FIELD_LABELS: Record<TDebtField, string> = {
  balance: 'balance',
  interestRate: 'interest rate',
  escrow: 'escrow',
};

function describe(projection: TPayoffProjection): { label: string; color: 'success' | 'default' | 'warning' } {
  switch (projection.status) {
    case 'paidOff':
      return { label: `Paid off ${formatLongDate(projection.date)}`, color: 'success' };
    case 'neverPaysOff':
      return { label: 'Never at current payment', color: 'warning' };
    case 'beyondHorizon':
      return { label: 'Beyond 10 years', color: 'default' };
    case 'missingValues':
      return {
        label: `Needs ${projection.fields.map((field) => FIELD_LABELS[field]).join(', ')}`,
        color: 'warning',
      };
  }
}

// When each debt is paid off if every payment is made on time.
const PayoffList = ({ payoffs }: IPayoffListProps) => {
  if (payoffs.length === 0) {
    return <Typography color="text.secondary">No debts with balances on file</Typography>;
  }
  return (
    <List disablePadding>
      {payoffs.map((payoff, index) => {
        const { label, color } = describe(payoff.projection);
        return (
          <ListItem key={`${payoff.name}-${index}`} divider={index < payoffs.length - 1} disableGutters>
            <ListItemText primary={payoff.name} />
            <Chip size="small" variant="outlined" color={color} label={label} />
          </ListItem>
        );
      })}
    </List>
  );
};

export default PayoffList;
