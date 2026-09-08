import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { IDeposit } from '../types/IRunwayData';

interface IDepositsEditorProps {
  items: IDeposit[];
  onChange: (items: IDeposit[]) => void;
}

const DepositsEditor = ({ items }: IDepositsEditorProps) => {
  return (
    <Box>
      <Typography variant="h6">Deposits</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText
              primary={`${item.name}: $${item.amount.toFixed(2)} (${item.frequency}, day ${item.day})`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DepositsEditor;
