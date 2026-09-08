import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { ICashOnHandEntry } from '../types/IRunwayData';

interface ICashOnHandEditorProps {
  items: ICashOnHandEntry[];
  onChange: (items: ICashOnHandEntry[]) => void;
}

const CashOnHandEditor = ({ items }: ICashOnHandEditorProps) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box>
      <Typography variant="h6">Cash on Hand</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText
              primary={`${item.name}: $${item.amount.toFixed(2)}${
                item.institution ? ` (${item.institution})` : ''
              }`}
            />
          </ListItem>
        ))}
      </List>
      <Typography>Total: ${total.toFixed(2)}</Typography>
    </Box>
  );
};

export default CashOnHandEditor;
