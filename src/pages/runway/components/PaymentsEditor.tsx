import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { IPayment } from '../types/IRunwayData';

interface IPaymentsEditorProps {
  items: IPayment[];
  onChange: (items: IPayment[]) => void;
}

function describePayment(payment: IPayment): string {
  const parts = [`${payment.name}: $${payment.amount.toFixed(2)} (day ${payment.day})`];
  if (payment.creditor) parts.push(`(${payment.creditor})`);
  if (payment.pastDue) parts.push(`— past due $${payment.pastDue.toFixed(2)}`);
  return parts.join(' ');
}

const PaymentsEditor = ({ items }: IPaymentsEditorProps) => {
  return (
    <Box>
      <Typography variant="h6">Payments &amp; Debts</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText primary={describePayment(item)} secondary={item.note} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PaymentsEditor;
