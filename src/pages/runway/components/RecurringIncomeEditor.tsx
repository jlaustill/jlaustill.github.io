import { useState } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Button, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IRecurringIncome, TIncomeSchedule } from '../types/IRunwayData';
import { fieldError } from './fieldError';
import { numberOrZero } from './fieldValues';

interface IRecurringIncomeEditorProps {
  items: IRecurringIncome[];
  onChange: (items: IRecurringIncome[]) => void;
}

const SCHEDULES: TIncomeSchedule[] = ['semi-monthly', 'monthly', 'weekly'];

const recurringIncomeSchema = Yup.object({
  entries: Yup.array(
    Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required'),
    }),
  ),
});

// Days of the month (1 to 31), or ISO weekdays (1 to 7) when weekly, typed as "1, 15".
function parseDays(text: string, schedule: string): number[] {
  const highest = schedule === 'weekly' ? 7 : 31;
  return text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= highest);
}

const sameDays = (a: number[], b: number[]) => a.length === b.length && a.every((day, index) => day === b[index]);

interface IDaysFieldProps {
  days: number[];
  schedule: string;
  onCommit: (days: number[]) => void;
}

// Keeps the typed text locally so "1, " can be typed on the way to "1, 15". Days are committed
// on blur only when the text was actually changed, so tabbing through never rewrites what the
// file holds; text with no valid day in it puts the previous text back.
const DaysField = ({ days, schedule, onCommit }: IDaysFieldProps) => {
  const shownText = days.join(', ');
  const [text, setText] = useState(shownText);
  return (
    <TextField
      size="small"
      fullWidth
      label="Days"
      helperText="e.g. 1, 15"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        if (text === shownText) {
          return;
        }
        const parsed = parseDays(text, schedule);
        if (parsed.length === 0) {
          setText(shownText);
          return;
        }
        setText(parsed.join(', '));
        onCommit(parsed);
      }}
    />
  );
};

const dollars = {
  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
  inputLabel: { shrink: true },
};

const RecurringIncomeEditor = ({ items, onChange }: IRecurringIncomeEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={recurringIncomeSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, errors, touched, handleBlur, setFieldValue }) => (
        <Form>
          <Typography variant="h6" gutterBottom>
            Income
          </Typography>
          <FieldArray name="entries">
            {({ push, remove }) => (
              <>
                {values.entries.map((entry, index) => {
                  const days = Array.isArray(entry.days) ? entry.days : [];
                  const schedules = SCHEDULES.includes(entry.schedule) ? SCHEDULES : [...SCHEDULES, entry.schedule];
                  return (
                    <Grid container spacing={1} alignItems="flex-start" key={index} sx={{ mb: 1 }}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Field
                          as={TextField}
                          size="small"
                          fullWidth
                          label="Name"
                          name={`entries.${index}.name`}
                          {...fieldError(errors, touched, `entries.${index}.name`)}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            handleBlur(e);
                            onChange(values.entries);
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <Field
                          as={TextField}
                          size="small"
                          fullWidth
                          type="number"
                          label="Amount"
                          name={`entries.${index}.amount`}
                          slotProps={dollars}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue(`entries.${index}.amount`, numberOrZero(e.target.value));
                          }}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            handleBlur(e);
                            onChange(values.entries);
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          label="Schedule"
                          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                          value={entry.schedule}
                          onChange={(event) => {
                            const schedule = event.target.value as TIncomeSchedule;
                            setFieldValue(`entries.${index}.schedule`, schedule);
                            onChange(values.entries.map((item, i) => (i === index ? { ...item, schedule } : item)));
                          }}
                        >
                          {schedules.map((schedule) => (
                            <option key={schedule} value={schedule}>
                              {schedule}
                            </option>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 10, sm: 9, md: 4 }}>
                        <DaysField
                          key={days.join(',')}
                          days={days}
                          schedule={entry.schedule}
                          onCommit={(nextDays) => {
                            if (sameDays(nextDays, days)) {
                              onChange(values.entries);
                              return;
                            }
                            setFieldValue(`entries.${index}.days`, nextDays);
                            onChange(values.entries.map((item, i) => (i === index ? { ...item, days: nextDays } : item)));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 3, md: 1 }}>
                        <IconButton
                          aria-label="Remove"
                          onClick={() => {
                            remove(index);
                            onChange(values.entries.filter((_, i) => i !== index));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  );
                })}
                <Button
                  type="button"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const next: IRecurringIncome = { name: '', amount: 0, schedule: 'semi-monthly', days: [1, 15] };
                    push(next);
                    onChange([...values.entries, next]);
                  }}
                >
                  Add Income
                </Button>
              </>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
};

export default RecurringIncomeEditor;
