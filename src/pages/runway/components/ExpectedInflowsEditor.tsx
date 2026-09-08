import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { IExpectedInflow } from '../types/IRunwayData';

interface IExpectedInflowsEditorProps {
  items: IExpectedInflow[];
  onChange: (items: IExpectedInflow[]) => void;
}

const ExpectedInflowsEditor = ({ items }: IExpectedInflowsEditorProps) => {
  return (
    <Box>
      <Typography variant="h6">Expected Inflows</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText
              primary={`${item.name}: $${item.amount.toFixed(2)} (${item.date ?? 'no date yet'})`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ExpectedInflowsEditor;
