import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Temporal } from '@js-temporal/polyfill';
import { describeUpdated, formatMoneyInput, parseMoneyInput } from '../format';
import type { ICashOnHandEntry } from '../types/IRunwayData';

interface IBalancesCardProps {
  items: ICashOnHandEntry[];
  onChange: (items: ICashOnHandEntry[]) => void;
  today: Temporal.PlainDate;
}

interface IBalanceFieldProps {
  amount: number;
  onCommit: (amount: number) => void;
}

// Keeps the typed text locally and commits on blur, only when the amount actually changed.
// Text that is not an amount puts the previous balance back.
const BalanceField = ({ amount, onCommit }: IBalanceFieldProps) => {
  const shown = formatMoneyInput(amount);
  const [text, setText] = useState(shown);
  return (
    <TextField
      size="small"
      label="Balance"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const parsed = parseMoneyInput(text);
        if (parsed === null || parsed === amount) {
          setText(shown);
          return;
        }
        setText(formatMoneyInput(parsed));
        onCommit(parsed);
      }}
      slotProps={{
        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
        htmlInput: { inputMode: 'decimal' },
      }}
      sx={{ width: 160 }}
    />
  );
};

type TDialogState =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'rename'; index: number }
  | { kind: 'delete'; index: number };

interface IAccountDialogProps {
  mode: 'add' | 'rename';
  initialName: string;
  onCancel: () => void;
  onSubmit: (name: string, amount: number) => void;
}

const AccountDialog = ({ mode, initialName, onCancel, onSubmit }: IAccountDialogProps) => {
  const [name, setName] = useState(initialName);
  const [balance, setBalance] = useState('');
  const trimmed = name.trim();
  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{mode === 'add' ? 'Add account' : 'Rename account'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Name" required autoFocus value={name} onChange={(event) => setName(event.target.value)} />
          {mode === 'add' && (
            <TextField
              label="Balance"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                htmlInput: { inputMode: 'decimal' },
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          disabled={trimmed === ''}
          onClick={() => onSubmit(trimmed, parseMoneyInput(balance) ?? 0)}
        >
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// The check-in's editor: one row per account, a balance to update, and how old it is. Every
// edit spreads the original entry, so keys this card never shows survive.
const BalancesCard = ({ items, onChange, today }: IBalancesCardProps) => {
  const [dialog, setDialog] = useState<TDialogState>({ kind: 'closed' });
  const [menu, setMenu] = useState<{ anchor: HTMLElement; index: number } | null>(null);
  const todayIso = today.toString();

  const replace = (index: number, entry: ICashOnHandEntry) =>
    onChange(items.map((item, i) => (i === index ? entry : item)));
  const closeDialog = () => setDialog({ kind: 'closed' });

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Balances
      </Typography>
      <List disablePadding>
        {items.map((entry, index) => {
          const updated = describeUpdated(entry.updatedAt, today);
          return (
            <ListItem key={index} divider={index < items.length - 1} disableGutters sx={{ gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 140 }}>
                <Typography fontWeight={500}>{entry.name}</Typography>
                {entry.institution && (
                  <Typography variant="body2" color="text.secondary">
                    {entry.institution}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  color={updated.stale ? 'warning.main' : 'text.secondary'}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  {updated.stale && <WarningAmberIcon fontSize="inherit" titleAccess="Needs checking" />}
                  {updated.text}
                </Typography>
              </Box>
              <BalanceField
                key={`${index}-${entry.amount}`}
                amount={entry.amount}
                onCommit={(amount) => replace(index, { ...entry, amount, updatedAt: todayIso })}
              />
              <Tooltip title="Balance is still correct">
                <IconButton
                  aria-label={`Mark ${entry.name} as checked`}
                  onClick={() => replace(index, { ...entry, updatedAt: todayIso })}
                >
                  <TaskAltIcon />
                </IconButton>
              </Tooltip>
              <IconButton
                aria-label={`More for ${entry.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, index })}
              >
                <MoreVertIcon />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
      <Button startIcon={<AddIcon />} onClick={() => setDialog({ kind: 'add' })} sx={{ mt: 1 }}>
        Add account
      </Button>

      <Menu anchorEl={menu?.anchor ?? null} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) setDialog({ kind: 'rename', index: menu.index });
            setMenu(null);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) setDialog({ kind: 'delete', index: menu.index });
            setMenu(null);
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {dialog.kind === 'add' && (
        <AccountDialog
          mode="add"
          initialName=""
          onCancel={closeDialog}
          onSubmit={(name, amount) => {
            onChange([...items, { name, amount, updatedAt: todayIso }]);
            closeDialog();
          }}
        />
      )}
      {dialog.kind === 'rename' && (
        <AccountDialog
          mode="rename"
          initialName={items[dialog.index]?.name ?? ''}
          onCancel={closeDialog}
          onSubmit={(name) => {
            replace(dialog.index, { ...items[dialog.index], name });
            closeDialog();
          }}
        />
      )}
      {dialog.kind === 'delete' && (
        <Dialog open onClose={closeDialog}>
          <DialogTitle>{`Delete ${items[dialog.index]?.name ?? 'this account'}?`}</DialogTitle>
          <DialogContent>
            <DialogContentText>It is removed from runway.json.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                onChange(items.filter((_, i) => i !== dialog.index));
                closeDialog();
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

export default BalancesCard;
